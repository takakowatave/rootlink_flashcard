/**
 * featureFlags.ts
 * 未公開機能の出し分け。main にマージしても客に見えない状態を保つためのスイッチ。
 */

// フレーズ/熟語機能を一般ユーザーに公開するか。
// false の間は検索サジェスト・検索実行の熟語フォールバックに出ない
// （/phrases は直リンクのみで到達可能・/word/[phrase] も直リンクなら到達可）。
export const PHRASES_PUBLIC = false
