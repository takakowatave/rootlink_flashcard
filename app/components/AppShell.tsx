'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'
import TutorialOverlay from './TutorialOverlay'
import OnboardingQuestions from './OnboardingQuestions'
import { isNativePlatform } from '@/lib/isNativePlatform'

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
