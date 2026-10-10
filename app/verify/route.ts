import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

/**
 * メール認証リンクの着地点。Supabase の Email Template は type を直接ハードコードする。
 *   - Confirm sign up : {{ .SiteURL }}/verify?token_hash={{ .TokenHash }}&type=email
 *   - Reset password  : {{ .SiteURL }}/verify?token_hash={{ .TokenHash }}&type=recovery
 *   - Change email    : {{ .SiteURL }}/verify?token_hash={{ .TokenHash }}&type=email_change
 * ({{ .Type }} 変数は Supabase に存在しないため、テンプレごとに直接書く)
 *
 * 旧テンプレで配信された未開封メールの互換として type=signup も受理する。
 *
 * recovery のみ /reset-password に送り、それ以外は /callback (profile 補完 + 計測) 経由で /。
 * パラメータ不足 / 想定外 type / verifyOtp 失敗はすべて /callback?state=confirmed の失敗画面に流す。
 *
 * client-side 判定 (AppShell の useEffect で token_hash を見る実装) は hydration タイミング /
 * middleware の cookie 書き換え / 既存 session の有無 で取りこぼすことがあったため、
 * route handler に移管して HTTP リクエスト到達時に必ず Set-Cookie 付きで redirect する。
 */

// 受け入れる type のホワイトリスト。想定外は失敗画面に落とす。
const ALLOWED_TYPES: ReadonlySet<EmailOtpType> = new Set<EmailOtpType>([
  'email',
  'email_change',
  'recovery',
  'signup',
])

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const typeRaw = searchParams.get('type')

  // パラメータ不足 / 未知の type は /callback の失敗画面に流す
  if (!tokenHash || !typeRaw || !ALLOWED_TYPES.has(typeRaw as EmailOtpType)) {
    return NextResponse.redirect(new URL('/callback?state=confirmed', request.url))
  }
  const type = typeRaw as EmailOtpType

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
    type,
  })

  if (error) {
    return NextResponse.redirect(new URL('/callback?state=confirmed', request.url))
  }

  // recovery のみ /reset-password に直接送る。email / email_change / signup は
  // /callback で profile 補完 + sign_up_complete 計測を通してから / に送る。
  const redirectTo = type === 'recovery' ? '/reset-password' : '/callback'
  return NextResponse.redirect(new URL(redirectTo, request.url))
}
