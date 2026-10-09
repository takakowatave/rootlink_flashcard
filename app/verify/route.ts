import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

/**
 * メール認証リンクの着地点。Supabase の Email Template を
 *   {{ .SiteURL }}/verify?token_hash={{ .TokenHash }}&type={{ .Type }}
 * に設定しておくと、ここで server-side で verifyOtp して session cookie を張り、
 * recovery → /reset-password、それ以外 → /callback に流す。
 *
 * client-side 判定 (AppShell の useEffect で token_hash を見る実装) は、Vercel の
 * hydration タイミング / middleware の cookie 書き換え / 既存 session の有無 で
 * 失敗パターンが多かった。route handler なら HTTP リクエスト到達時に
 * 必ず走り、Set-Cookie 付きで redirect できるので取りこぼしがない。
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const typeRaw = searchParams.get('type')

  // パラメータ不足は /callback の失敗画面に流す (「リンクの有効期限が切れているか…」)
  if (!tokenHash || !typeRaw) {
    return NextResponse.redirect(new URL('/callback?state=confirmed', request.url))
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    },
  )

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: typeRaw as EmailOtpType,
  })

  if (error) {
    return NextResponse.redirect(new URL('/callback?state=confirmed', request.url))
  }

  // recovery だけ /reset-password に直接送り、他 (signup / email_change / magiclink / invite) は
  // /callback で profile 補完 + 計測を通してから / に送る。
  const redirectTo = typeRaw === 'recovery' ? '/reset-password' : '/callback'
  return NextResponse.redirect(new URL(redirectTo, request.url))
}
