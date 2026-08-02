/**
 * apiClient
 *
 * 責務:
 * - フロントからCloud Run APIへリクエストを送る共通関数
 * - ベースURL管理を一元化する
 * - レスポンスのJSONパースを統一する
 *
 * 設計:
 * - NEXT_PUBLIC_CLOUDRUN_API_URL があればそれを使用
 * - なければ本番Cloud Run URLにフォールバック
 * - 開発時のみURLをログ出力
 */

export async function apiRequest(
  path: string,
  options: RequestInit = {}
) {
  // ベースURL決定
  const baseUrl =
    process.env.NEXT_PUBLIC_CLOUDRUN_API_URL ??
    "https://rootlink-server-v2-774622345521.asia-northeast1.run.app";

  const normalizedBase = baseUrl.replace(/\/$/, "");

  const url = `${normalizedBase}${path.startsWith("/") ? path : `/${path}`}`;

  // 開発環境のみURL確認ログ
  if (process.env.NODE_ENV === "development") {
    console.log("[apiRequest] URL:", url);
  }

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    if (process.env.NODE_ENV === "development") {
      console.error("API error:", res.status, text);
    }
    throw new Error(`API error: ${res.status}`);
  }

  const rawText = await res.text();

  try {
    return JSON.parse(rawText);
  } catch {
    if (process.env.NODE_ENV === "development") {
      console.error("JSON parse error:", rawText);
    }
    throw new Error("Invalid JSON response");
  }
}