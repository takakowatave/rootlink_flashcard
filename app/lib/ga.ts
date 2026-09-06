// GA4 (gtag) イベント送信の薄いラッパー。
// - gtag が読み込まれる前・SSR 時は静かにスキップ
// - 本番のみ送信（開発・プレビューは console.debug で確認できるようにする）

type GtagFn = (
  command: 'event',
  eventName: string,
  params?: Record<string, unknown>
) => void

declare global {
  interface Window {
    gtag?: GtagFn
  }
}

function isProdHost(): boolean {
  if (typeof window === 'undefined') return false
  const h = window.location.hostname
  return h === 'www.rootlink.app' || h === 'rootlink.app'
}

export function sendEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  const payload = params ?? {}
  if (isProdHost() && typeof window.gtag === 'function') {
    window.gtag('event', name, payload)
    return
  }
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('[ga4:dev]', name, payload)
  }
}
