/**
 * quotaExceeded
 *
 * /resolve が 429 QUOTA_EXCEEDED を返したときに、既存のペイウォール
 * (UpgradeModal: Web / NativePaywall: native) を開くための CustomEvent 配線。
 * 新しい画面は作らず、AppShell に置いた QuotaExceededListener が window の
 * event を受けて既存ペイウォールコンポーネントをモーダル表示する。
 */

export const QUOTA_EXCEEDED_EVENT = 'rootlink-quota-exceeded'

export function emitQuotaExceeded() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(QUOTA_EXCEEDED_EVENT))
}
