export async function apiRequest(
  path: string,
  options: RequestInit = {}
) {
  const baseUrl = process.env.NEXT_PUBLIC_CLOUDRUN_API_URL
    ?.replace(/\/$/, "");

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_CLOUDRUN_API_URL is not defined");
  }

  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

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
    throw new Error(`API error: ${res.status}`);
  }

  // ===== ここが唯一の「AI raw」観測ポイント =====
  const rawText = await res.text();
  console.log("🔴 AI RAW:", rawText);

  // 既存の契約は壊さない
  return JSON.parse(rawText);
}
