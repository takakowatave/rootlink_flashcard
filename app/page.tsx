import { createSupabaseServerClient } from '@/lib/supabaseServer'
import Dashboard from '@/components/Dashboard'
import LPClient from '@/components/LPClient'

export default async function HomePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) return <Dashboard />
  return <LPClient />
}
