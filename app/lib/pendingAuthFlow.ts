// アプリ内で始めた「メール認証を伴う操作」の種類を、
// deeplink で戻ってきたときに識別するためのマーカー。
//
// 経路: モーダルから supabase の resetPasswordForEmail / updateUser を
// 呼ぶ直前に set → メールを開いた先の 302 で com.rootlink.app://auth-callback
// が起動 → AppShell.appUrlOpen が exchangeCodeForSession の後に
// consume して遷移先を分岐 → クリア。
//
// localStorage は Capacitor WebView でも同じ WebView プロセスに永続化
// されるので、アプリを一度閉じてメール → タップで戻ってきても残る。
// 1 時間より古い印は無視（放置後の別操作で誤発火しないように）。

const KEY = 'rootlink-pending-auth-flow'
const MAX_AGE_MS = 60 * 60 * 1000

export type PendingAuthFlow = 'recovery' | 'email_change'

type StoredValue = {
  flow: PendingAuthFlow
  ts: number
}

export function setPendingAuthFlow(flow: PendingAuthFlow): void {
  if (typeof window === 'undefined') return
  try {
    const value: StoredValue = { flow, ts: Date.now() }
    window.localStorage.setItem(KEY, JSON.stringify(value))
  } catch {
    // localStorage 使用不可（プライベートブラウズ等）は無視
  }
}

export function consumePendingAuthFlow(): PendingAuthFlow | null {
  if (typeof window === 'undefined') return null
  let raw: string | null
  try {
    raw = window.localStorage.getItem(KEY)
    window.localStorage.removeItem(KEY)
  } catch {
    return null
  }
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<StoredValue>
    if (!parsed || typeof parsed.ts !== 'number') return null
    if (Date.now() - parsed.ts > MAX_AGE_MS) return null
    if (parsed.flow === 'recovery' || parsed.flow === 'email_change') {
      return parsed.flow
    }
    return null
  } catch {
    return null
  }
}
