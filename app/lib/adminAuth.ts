import { createSupabaseServerClient } from './supabaseServer'

// 管理者メールの許可リスト。
// Vercel 側の ADMIN_EMAILS (カンマ区切り) を優先。未設定時は kiko のみ許可。
// Server-only で参照する想定。クライアントから見えないようにする。
function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS?.trim()
  if (!raw) return ['kikotkk@gmail.com']
  return raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
}

export type AdminCheckResult =
  | { ok: true; email: string; userId: string }
  | { ok: false; reason: 'UNAUTHENTICATED' | 'NOT_ADMIN' }

export async function checkAdminServer(): Promise<AdminCheckResult> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return { ok: false, reason: 'UNAUTHENTICATED' }
  const email = user.email.toLowerCase()
  if (!getAdminEmails().includes(email)) return { ok: false, reason: 'NOT_ADMIN' }
  return { ok: true, email, userId: user.id }
}
