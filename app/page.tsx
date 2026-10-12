import type { Metadata } from 'next'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import Dashboard from '@/components/Dashboard'
import HomePageClientFallback from '@/components/HomePageClientFallback'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

export default async function HomePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) return <Dashboard />
  // Cookie からセッションが見えないときのフォールバック。
  // ネイティブは Preferences 保存なので SSR では常にここに来る → client で復元を試みる。
  // Web (ブラウザ) で未ログインなら fallback 内の LPClient がそのまま描画される。
  return <HomePageClientFallback />
}
