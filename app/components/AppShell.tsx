'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'
import TutorialOverlay from './TutorialOverlay'
import OnboardingQuestions from './OnboardingQuestions'
import { isNativePlatform } from '@/lib/isNativePlatform'
import { supabase } from '@/lib/supabaseClient'
import { ensureRevenueCatConfigured } from '@/lib/revenuecat'
import { recordActivity } from '@/lib/supabaseApi'
import { consumePendingAuthFlow } from '@/lib/pendingAuthFlow'

type PluginListenerHandle = { remove: () => Promise<void> }

// profile 自己修復完了を Header / OnboardingQuestions / TutorialOverlay に通知する
// 過去の壊れた /callback で auth ユーザーだけ作られて profiles 行が無いユーザーを救う
export const PROFILE_CREATED_EVENT = 'rootlink-profile-created'

// 同じ token_hash / code で二度 verifyOtp / exchangeCodeForSession が
// 走るのを防ぐキャッシュ。app-return の自動遷移 + ボタンで deeplink が
// 二度発火した場合、2 回目は「使用済み」で失敗して失敗画面に落ちるため。
// module スコープに置くのは AppShell の再マウント (fast refresh 等) をまたいで
// 同一ドキュメントの間は覚えておくため。
const processedAuthTokens = new Set<string>()

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    let cancelled = false

    const ensureProfile = async (userId: string) => {
      if (cancelled) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.id !== userId || cancelled) return
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()
      if (existing || cancelled) return
      const username =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        ''
      const avatar_url =
        user.user_metadata?.avatar_url || user.user_metadata?.picture || null
      const { error } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        username,
        avatar_url,
      })
      if (!error && !cancelled) {
        window.dispatchEvent(new CustomEvent(PROFILE_CREATED_EVENT))
      }
    }

    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) await ensureProfile(session.user.id)
    })()

    const { data: authSub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        ensureProfile(session.user.id)
      }
    })

    return () => {
      cancelled = true
      authSub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      await recordActivity(user.id)
      window.dispatchEvent(new Event('streak-updated'))
    }
    tick()
    const onVisible = () => { if (document.visibilityState === 'visible') tick() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [pathname])

  useEffect(() => {
    if (!isNativePlatform()) return
    ;(async () => {
      try {
        const mod = await import('@capacitor/splash-screen')
        await mod.SplashScreen.hide({ fadeOutDuration: 250 })
      } catch {
        // splash plugin unavailable; ignore
      }
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar')
        await StatusBar.setStyle({ style: Style.Light })
        await StatusBar.setBackgroundColor({ color: '#ffffff' })
      } catch {
        // status-bar plugin unavailable; ignore
      }
    })()
  }, [])

  useEffect(() => {
    if (!isNativePlatform()) return
    let handle: PluginListenerHandle | null = null
    ;(async () => {
      try {
        const { App } = await import('@capacitor/app')
        const { Browser } = await import('@capacitor/browser')
        handle = await App.addListener('appUrlOpen', async (event: { url: string }) => {
          if (!event.url.startsWith('com.rootlink.app://auth-callback')) return
          await Browser.close().catch(() => {})

          const query = event.url.includes('?') ? event.url.split('?')[1].split('#')[0] : ''
          const params = new URLSearchParams(query)

          // token_hash 方式 (新, PKCE の code_verifier 依存を回避)
          // Supabase テンプレートの {{ .ConfirmationURL }} を
          //   {{ .SiteURL }}/auth/app-return?token_hash={{ .TokenHash }}&type={{ .Type }}
          // に切り替えたときにここが走る。type は signup / recovery / email_change。
          const tokenHash = params.get('token_hash')
          const type = params.get('type')
          if (tokenHash && type) {
            // 同一 token を二度検証しない。1回目で成功 → 2回目は「使用済み」で
            // 失敗して失敗画面に落ちる問題を防ぐ。
            const key = `token:${type}:${tokenHash}`
            if (processedAuthTokens.has(key)) return
            processedAuthTokens.add(key)

            const { error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              // Supabase の EmailOtpType: 'signup' | 'recovery' | 'email_change' 等
              type: type as 'signup' | 'recovery' | 'email_change' | 'magiclink' | 'invite',
            })
            if (!error) {
              // type=recovery だけ reset-password 画面へ、それ以外は callback。
              // pendingAuthFlow に頼らず deeplink の type で判定するのがポイント
              // (別ブラウザで開いた場合でも取り違えない)。
              consumePendingAuthFlow()
              window.location.href = type === 'recovery' ? '/reset-password' : '/callback'
              return
            }
            // 失敗時: 期限切れ / 使用済み / bad_code_verifier を含む。
            // ただし別窓 / 前回で verify 済みで既にセッションが張られている
            // ケースがあるので、セッションがあれば失敗画面ではなく通常経路へ。
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
              consumePendingAuthFlow()
              window.location.href = type === 'recovery' ? '/reset-password' : '/callback'
              return
            }
            window.location.href = '/callback?state=confirmed'
            return
          }

          // 旧 PKCE 方式のフォールバック。既存メールがまだ届いていない期間の互換用。
          const code = params.get('code')
          if (code) {
            const key = `code:${code}`
            if (processedAuthTokens.has(key)) return
            processedAuthTokens.add(key)

            const { error } = await supabase.auth.exchangeCodeForSession(code)
            if (!error) {
              const flow = consumePendingAuthFlow()
              window.location.href = flow === 'recovery' ? '/reset-password' : '/callback'
              return
            }
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
              const flow = consumePendingAuthFlow()
              window.location.href = flow === 'recovery' ? '/reset-password' : '/callback'
              return
            }
            window.location.href = '/callback?state=confirmed'
            return
          }

          // hash fragment (#access_token=...) は magic link の別形式で来る場合の保険。
          const fragment = event.url.split('#')[1] ?? ''
          const hashParams = new URLSearchParams(fragment)
          const access_token = hashParams.get('access_token')
          const refresh_token = hashParams.get('refresh_token')
          if (access_token && refresh_token) {
            const key = `access:${access_token}`
            if (processedAuthTokens.has(key)) return
            processedAuthTokens.add(key)

            await supabase.auth.setSession({ access_token, refresh_token })
            const flow = consumePendingAuthFlow()
            window.location.href = flow === 'recovery' ? '/reset-password' : '/callback'
          }
        })
      } catch {
        // plugins unavailable in web preview; ignore
      }
    })()
    return () => { handle?.remove() }
  }, [])

  useEffect(() => {
    if (!isNativePlatform()) return
    let unsub: (() => void) | null = null
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      await ensureRevenueCatConfigured(session?.user?.id ?? null).catch(() => {})
      const { data } = supabase.auth.onAuthStateChange((_event, s) => {
        ensureRevenueCatConfigured(s?.user?.id ?? null).catch(() => {})
      })
      unsub = () => data.subscription.unsubscribe()
    })()
    return () => { unsub?.() }
  }, [])

  const isLP = pathname === '/' || pathname === '/about'
  const isAuth =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/reset-password' ||
    pathname === '/callback' ||
    pathname === '/auth/app-return'
  const isQuiz = pathname === '/quiz'
  const isWordDetail = pathname?.startsWith('/word/') ?? false
  const isOnboarding = pathname === '/onboarding'
  const hideChrome = isAuth || isQuiz || isOnboarding

  // 戻る + 検索の 56px ヘッダー (PageHeader / WordPageClient) を出す画面。
  // SP ではロゴのヘッダーと相互排他にして 2 段にならないよう隠す。
  // PC ではロゴ Header を残す（PageHeader は PC ではパンくずのみに切り替わる）。
  const isBackHeader =
    isWordDetail ||
    pathname === '/wordlist' ||
    (pathname?.startsWith('/decks') ?? false)

  return (
    <div className={isLP || hideChrome ? '' : 'min-h-screen bg-[#f8fafc]'}>
      {!hideChrome && (
        <div className={isBackHeader ? 'hidden md:contents' : 'contents'}>
          <Header />
        </div>
      )}
      {!hideChrome && <OnboardingQuestions />}
      {!hideChrome && <TutorialOverlay />}
      {children}
      {!isLP && !hideChrome && (
        <div className={isWordDetail ? 'hidden md:contents' : 'contents'}>
          <Footer />
        </div>
      )}
    </div>
  )
}
