/**
 * apiClient
 *
 * 外部 API（Cloud Run など）を呼び出すための共通クライアント。
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

/* =================================================
 * apiRequest
 * =================================================
 */
export async function apiRequest(
  path: string,              // 例: "/word/apple" や "word/apple"
  options: RequestInit = {}  // fetch のオプション（method, body, headers など）
) {
  /**
   * Cloud Run の API の base URL
   */
  const baseUrl = process.env.NEXT_PUBLIC_CLOUDRUN_API_URL
    ?.replace(/\/$/, "");

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_CLOUDRUN_API_URL is not defined");
  }

  /**
   * URL を安全に結合
   */
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  if (process.env.NODE_ENV === "development") {
    console.log("[apiRequest] URL:", url);
  }

  /**
   * fetch 実行
   */
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}
