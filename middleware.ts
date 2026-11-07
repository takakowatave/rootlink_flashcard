import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()

  // ?lang=en / ?lang=ja が付いていたら Cookie に書き、layout.tsx が同じリクエスト内で
  // <html lang> と各ページの SSR 内容を正しい locale で返せるようにする。
  // request.cookies にも入れることで、同じリクエスト内の layout.tsx / page.tsx の
  // cookies().get() から読み取れる。response.cookies はブラウザに戻す用。
  const lang = request.nextUrl.searchParams.get('lang')?.toLowerCase()
  if (lang === 'ja' || lang === 'en') {
    const current = request.cookies.get('rootlink_locale')?.value
    if (current !== lang) {
      request.cookies.set('rootlink_locale', lang)
      response.cookies.set('rootlink_locale', lang, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      })
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
