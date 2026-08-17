'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'
import TutorialOverlay from './TutorialOverlay'
import OnboardingQuestions from './OnboardingQuestions'
import { isNativePlatform } from '@/lib/isNativePlatform'
import { supabase } from '@/lib/supabaseClient'

type PluginListenerHandle = { remove: () => Promise<void> }

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    if (!isNativePlatform()) return
    ;(async () => {
      try {
        const mod = await import('@capacitor/splash-screen')
        await mod.SplashScreen.hide({ fadeOutDuration: 250 })
      } catch {
        // splash plugin unavailable; ignore
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

  const isLP = pathname === '/' || pathname === '/about'
  const isAuth = pathname === '/login' || pathname === '/signup'
  const isQuiz = pathname === '/quiz'
  const isWordDetail = pathname?.startsWith('/word/') ?? false

  return (
    <div className={isLP || isAuth || isQuiz ? '' : 'min-h-screen bg-[#f8fafc]'}>
      {!isQuiz && !isAuth && (
        <div className={isWordDetail ? 'hidden md:contents' : 'contents'}>
          <Header />
        </div>
      )}
      {!isAuth && !isQuiz && <OnboardingQuestions />}
      {!isAuth && !isQuiz && <TutorialOverlay />}
      {children}
      {!isLP && !isAuth && !isQuiz && (
        <div className={isWordDetail ? 'hidden md:contents' : 'contents'}>
          <Footer />
        </div>
      )}
    </div>
  )
}
