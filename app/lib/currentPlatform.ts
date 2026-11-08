export type AppPlatform = 'ios' | 'android' | 'web'

// Capacitor.getPlatform() を profiles.signup_platform の値に揃えて返す。
export function currentPlatform(): AppPlatform {
  if (typeof window === 'undefined') return 'web'
  const cap = (window as { Capacitor?: { getPlatform?: () => string } }).Capacitor
  const p = typeof cap?.getPlatform === 'function' ? cap.getPlatform() : 'web'
  return p === 'ios' || p === 'android' ? p : 'web'
}
