import { notFound } from 'next/navigation'
import { checkAdminServer } from '@/lib/adminAuth'
import type { ReactNode } from 'react'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const result = await checkAdminServer()
  if (!result.ok) {
    // 存在自体を隠す。非 admin には 404 を返す。
    notFound()
  }
  return <>{children}</>
}
