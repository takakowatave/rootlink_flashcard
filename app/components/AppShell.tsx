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

type PluginListenerHandle = { remove: () => Promise<void> }

// profile 自己修復完了を Header / OnboardingQuestions / TutorialOverlay に通知する
// 過去の壊れた /callback で auth ユーザーだけ作られて profiles 行が無いユーザーを救う
export const PROFILE_CREATED_EVENT = 'rootlink-profile-created'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    let cancelled = false
    const ensureProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || cancelled) return
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
    ensureProfile()
    return () => {
      cancelled = true
    }
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
          if (!event.url.startsWith('com.rootlink.app://auth-callback')) return
          await Browser.close().catch(() => {})

          const queryMatch = event.url.match(/[?&]code=([^&]+)/)
          const code = queryMatch ? decodeURIComponent(queryMatch[1]) : null
          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code)
            if (!error) window.location.href = '/callback'
            return
          }

          const fragment = event.url.split('#')[1] ?? ''
          const params = new URLSearchParams(fragment)
          const access_token = params.get('access_token')
          const refresh_token = params.get('refresh_token')
          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token })
            window.location.href = '/callback'
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
  const isAuth = pathname === '/login' || pathname === '/signup'
  const isQuiz = pathname === '/quiz'
  const isWordDetail = pathname?.startsWith('/word/') ?? false
  const isOnboarding = pathname === '/onboarding'
  const hideChrome = isAuth || isQuiz || isOnboarding

  return (
    <div className={isLP || hideChrome ? '' : 'min-h-screen bg-[#f8fafc]'}>
      {!hideChrome && (
        <div className={isWordDetail ? 'hidden md:contents' : 'contents'}>
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
