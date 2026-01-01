/**
 * apiRequest
 *
 * 外部 API（Cloud Run など）を呼び出すための共通関数。
 *
 * 役割：
 * - API の base URL を 1 か所に集約する
 * - fetch の書き方を統一する
 * - URL の "/" 事故を防ぐ
 * - エラーハンドリングを共通化する
 *
 * ※ APIそのものを定義しているわけではない
 * ※ 「通信の土台（APIクライアント）」にあたる
 */

export async function apiRequest(
  path: string,              // 例: "/word/apple" や "word/apple"
  options: RequestInit = {}  // fetch のオプション（method, body, headers など）
) {
  /**
   * Cloud Run の API の base URL
   *
   * .env.local に定義した
   * NEXT_PUBLIC_CLOUDRUN_API_URL を使用する
   *
   * 例:
   * NEXT_PUBLIC_CLOUDRUN_API_URL=https://xxxx.a.run.app
   */
  const baseUrl = process.env.NEXT_PUBLIC_CLOUDRUN_API_URL
    ?.replace(/\/$/, ""); // ← 末尾の "/" があれば削除

  // 環境変数が未設定の場合は早めにエラーを出す
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_CLOUDRUN_API_URL is not defined");
  }

  /**
   * URL を安全に結合する
   *
   * - path が "/xxx" でも
   * - path が "xxx" でも
   *
   * 必ず
   *   baseUrl + "/xxx"
   * の形になるようにする
   */
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  // 開発時のみ URL を確認できるようにする
  if (process.env.NODE_ENV === "development") {
    console.log("[apiRequest] URL:", url);
  }

  /**
   * fetch 実行
   *
   * - JSON API 前提なので Content-Type を固定
   * - options で method / body などを上書き可能
   */
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  /**
   * ステータスコードが 2xx 以外ならエラー扱い
   * → 呼び出し元で try/catch できる
   */
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  /**
   * JSON レスポンスを返す
   * ※ 呼び出し側で型を決める
   */
  return res.json();
}
