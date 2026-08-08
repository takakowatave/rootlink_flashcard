'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'
import TutorialOverlay from './TutorialOverlay'
import OnboardingQuestions from './OnboardingQuestions'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLP = pathname === '/' || pathname === '/about'
  const isAuth = pathname === '/login' || pathname === '/signup'
  const isQuiz = pathname === '/quiz'
  const isWordDetail = pathname?.startsWith('/word/') ?? false

  return (
    <div className={isLP || isAuth || isQuiz || isWordDetail ? '' : 'min-h-screen bg-[#f8fafc]'}>
      {!isQuiz && !isAuth && !isWordDetail && <Header />}
      {!isAuth && !isQuiz && <OnboardingQuestions />}
      {!isAuth && !isQuiz && <TutorialOverlay />}
      {children}
      {!isLP && !isAuth && !isQuiz && !isWordDetail && <Footer />}
    </div>
  )
}
