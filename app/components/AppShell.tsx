'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'
import MobileSearchOverlay from './MobileSearchOverlay'
import TutorialOverlay from './TutorialOverlay'
import OnboardingQuestions from './OnboardingQuestions'
import QuotaExceededListener from './QuotaExceededListener'
import { isNativePlatform } from '@/lib/isNativePlatform'
import { supabase } from '@/lib/supabaseClient'
import { ensureRevenueCatConfigured } from '@/lib/revenuecat'
import { recordActivity } from '@/lib/supabaseApi'
import { isIdentityConflictError } from '@/lib/isIdentityConflictError'

type PluginListenerHandle = { remove: () => Promise<void> }

// profile 自己修復完了を Header / OnboardingQuestions / TutorialOverlay に通知する
// 過去の壊れた /callback で auth ユーザーだけ作られて profiles 行が無いユーザーを救う
export const PROFILE_CREATED_EVENT = 'rootlink-profile-created'

// 同じ OAuth code で二度 exchangeCodeForSession が走るのを防ぐキャッシュ。
// Google / Apple の deeplink が二重発火した場合に 2 回目が「使用済み」で
// 失敗するのを防ぐ。module スコープに置くのは AppShell の再マウント
// (fast refresh 等) をまたいで同一ドキュメントの間は覚えておくため。
const processedAuthTokens = new Set<string>()

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  // パスワード再設定リンクを踏むと Supabase が recovery セッションを張り、
  // SDK が onAuthStateChange(PASSWORD_RECOVERY) を発火する。
  // 従来は /reset-password 側でだけ listen していたため、Supabase hosted verify
  // → Site URL (= www.rootlink.app ホーム) に 302 で戻された場合、listener が
  // 存在せず「ログイン済みホーム画面」として描画されて再設定フォームが出なかった
  // (2026-10-07 kiko 報告)。グローバルに受けて /reset-password に遷移させる。
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== 'PASSWORD_RECOVERY') return
      // 既に /reset-password に居るなら触らない (無限 reload 回避)
      if (window.location.pathname === '/reset-password') return
      router.push('/reset-password')
    })
    return () => data.subscription.unsubscribe()
  }, [router])

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

  // App が前面に戻ったとき (iOS/Android の appStateChange) に、Supabase の
  // access_token を refresh する。native WebView を長時間 background に置くと
  // auto refresh の setTimeout が走らず、戻ってきたときに expired のまま fetch
  // して 401 → signOut 経路に落ちることがある (ゲスト運用ではデータ消失になる)。
  // 診断強化: SIGNED_OUT / TOKEN_REFRESHED をログに出して外れ経路を特定する。
  useEffect(() => {
    if (!isNativePlatform()) return
    let handle: PluginListenerHandle | null = null
    ;(async () => {
      try {
        const { App } = await import('@capacitor/app')
        handle = await App.addListener('appStateChange', ({ isActive }: { isActive: boolean }) => {
          if (!isActive) return
          void supabase.auth.refreshSession().then(({ error }) => {
            if (error) console.warn('[auth] refreshSession on resume failed:', error.message)
          })
        })
      } catch {
        // plugin unavailable; ignore
      }
    })()
    return () => { void handle?.remove() }
  }, [])

  useEffect(() => {
    const { data: authSub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        console.log('[auth]', event, { hasSession: !!session?.user, userId: session?.user?.id })
      }
    })
    return () => authSub.subscription.unsubscribe()
  }, [])

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
          // 受け入れる URL:
          //   1) com.rootlink.app://auth-callback?...        (Google / Apple OAuth の deeplink)
          //   2) https://www.rootlink.app/callback?...        (Universal Link で iOS が直接起動)
          //      Universal Links の apple-app-site-association が paths:['*'] なので、
          //      www.rootlink.app のあらゆる URL が native app で開く。auth 系以外は無視。
          const isCustomScheme = event.url.startsWith('com.rootlink.app://auth-callback')
          const isUniversalAuth = event.url.startsWith('https://www.rootlink.app/callback')
          if (!isCustomScheme && !isUniversalAuth) return
          await Browser.close().catch(() => {})

          const query = event.url.includes('?') ? event.url.split('?')[1].split('#')[0] : ''
          const params = new URLSearchParams(query)

          // deeplink が ?error= / ?error_code= / ?error_description= の形で戻る経路。
          // Supabase の OAuth callback が verify 失敗を返したとき、code ではなく
          // エラークエリとして戻ることがある (特に linkIdentity の email_exists)。
          // code の処理より前に拾い、衝突なら /callback の GuestLinkConfirmDialog
          // 経路、衝突以外のエラーなら「リンク無効/使用済み」画面へ流す。
          const errorCodeParam = params.get('error_code')
          const errorDescParam = params.get('error_description')
          const errorParam = params.get('error')
          if (errorCodeParam || errorDescParam || errorParam) {
            const conflict = isIdentityConflictError({
              code: errorCodeParam ?? undefined,
              message: errorDescParam ?? errorParam ?? undefined,
            })
            window.location.href = conflict
              ? '/callback?identity_conflict=1'
              : '/callback?state=confirmed'
            return
          }

          // OAuth (Google / Apple) の PKCE code。メール認証は OTP 方式に切り替えた
          // ため、deeplink で届く code はこの経路だけ。
          const code = params.get('code')
          if (code) {
            const key = `code:${code}`
            if (processedAuthTokens.has(key)) return
            processedAuthTokens.add(key)

            const { error } = await supabase.auth.exchangeCodeForSession(code)
            if (!error) {
              window.location.href = '/callback'
              return
            }
            // error があるとき: まず衝突かどうか判定する。衝突なら匿名セッションが
            // 残っていても /callback の GuestLinkConfirmDialog 経路に流す必要があるので、
            // session の有無で成功扱いにしてしまう経路より先に判定しなければならない。
            if (isIdentityConflictError(error)) {
              window.location.href = '/callback?identity_conflict=1'
              return
            }
            // 衝突でないエラー: 別経路で既にセッションが張られていれば成功扱い。
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
              window.location.href = '/callback'
              return
            }
            window.location.href = '/callback?state=confirmed'
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
    pathname === '/callback'
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
      {!hideChrome && <MobileSearchOverlay />}
      <QuotaExceededListener />
      {children}
      {!isLP && !hideChrome && (
        <div className={isWordDetail ? 'hidden md:contents' : 'contents'}>
          <Footer />
        </div>
      )}
    </div>
  )
}
