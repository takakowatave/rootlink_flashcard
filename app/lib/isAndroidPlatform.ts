// Capacitor Android のときだけ true。Web と iOS では false。
// Apple のポリシー上、Android アプリ側で「Sign in with Apple」を出す必要は
// なく、逆に Apple → Google のフローが Chrome Custom Tabs 経由で不安定に
// なるため、Android アプリでは表示しない。
export function isAndroidPlatform(): boolean {
  if (typeof window === 'undefined') return false
  const cap = (window as { Capacitor?: { getPlatform?: () => string } }).Capacitor
  return typeof cap?.getPlatform === 'function' && cap.getPlatform() === 'android'
}
