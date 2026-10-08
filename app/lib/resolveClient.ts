/**
 * resolveClient
 *
 * 責務:
 * - クライアントから /resolve を叩く共通関数
 * - Supabase セッションがあれば Authorization: Bearer を付ける
 *   （サーバー側が cache miss 時に user_id で日次カウントするため）
 * - エラーも含めて呼び出し側が status コードを扱えるよう、throw せず { ok, status, data } を返す
 */

import { supabase } from './supabaseClient'

const API_BASE =
  process.env.NEXT_PUBLIC_CLOUDRUN_API_URL ??
  'https://rootlink-server-v2-774622345521.asia-northeast1.run.app'

export type ResolveClientResult = {
  ok: boolean
  status: number
  data: unknown
}

export async function resolveWord(
  query: string,
  init: RequestInit = {},
): Promise<ResolveClientResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  }
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (token) headers.Authorization = `Bearer ${token}`
  } catch {
    // session 取れないときは Authorization 無しで送る（SSR / 失敗時）
  }

  const res = await fetch(`${API_BASE}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ query }),
    ...init,
    headers,
  })

  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    data = null
  }
  return { ok: res.ok, status: res.status, data }
}
