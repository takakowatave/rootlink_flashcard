'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLP = pathname === '/'
  const isAuth = pathname === '/login' || pathname === '/signup'
  const isQuiz = pathname === '/quiz'

  return (
    <div className={isLP || isAuth || isQuiz ? '' : 'min-h-screen bg-[#f8fafc]'}>
      {!isQuiz && <Header />}
      {children}
      {!isLP && !isAuth && !isQuiz && <Footer />}
    </div>
  )
}
