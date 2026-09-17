'use client'

// アプリでしか出ない画面 (オンボーディング / NativePaywall / 通知設定 等) を
// Web のプレビュー環境で確認できるようにする逃げ穴。
//
// 有効になる条件は AND:
//   - process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production'
//     (本番 rootlink.app では絶対に true にしない)
//   - URL の ?preview=native が付いている
//
// isNativePlatform() が false の Web で使うので、実端末 (Capacitor WebView) では
// これは呼ばれず、既存のロジックがそのまま動く。
//
// Vercel Preview の URL に ?preview=native を付ければ、Web ブラウザで
// native 前提の画面を強制表示できる。

export function isPreviewNative(): boolean {
  if (typeof window === 'undefined') return false
  // Vercel Preview / Development だけ許可
  const env = process.env.NEXT_PUBLIC_VERCEL_ENV
  if (env === 'production') return false
  try {
    const params = new URLSearchParams(window.location.search)
    return params.get('preview') === 'native'
  } catch {
    return false
  }
}

// isNativePlatform() の代わりに UI ガードで使う。
// 実 native と、Web プレビュー環境の ?preview=native の両方で true。
export function isNativeOrPreview(isNative: boolean): boolean {
  if (isNative) return true
  return isPreviewNative()
}
