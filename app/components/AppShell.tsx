'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLP = pathname === '/'
  const isAuth = pathname === '/login' || pathname === '/signup'

  return (
    <>
      <Header />
      {children}
      {!isLP && !isAuth && <Footer />}
    </>
  )
}
