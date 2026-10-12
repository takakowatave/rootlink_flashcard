import { createBrowserClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Supabase JS が localStorage/Cookie 用に生成するキーと同じ命名規則で揃える。
// Preferences 版 (ネイティブ) と Cookie 版 (Web) で同じ key を使うことで、
// 既存ユーザーのセッションを Cookie → Preferences へ透過的に移行できる。
function getAuthStorageKey(url: string): string {
  try {
    const host = new URL(url).hostname;
    const ref = host.split(".")[0];
    return `sb-${ref}-auth-token`;
  } catch {
    return "sb-auth-token";
  }
}
const AUTH_TOKEN_KEY = getAuthStorageKey(supabaseUrl);

// SSR 中は window が無いので必ず false。ブラウザでも Capacitor WebView でなければ false。
function isCapacitorNative(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return typeof cap?.isNativePlatform === "function" ? cap.isNativePlatform() : false;
}

// @supabase/ssr が document.cookie に書いた値を復元する。
//   - 非 chunked: "<name>=<value>"
//   - chunked:    "<name>.0=<v>", "<name>.1=<v>", ...
//   - value が "base64-" で始まるときは base64url エンコードされた JSON
// 既存の Cookie セッション (Web → ネイティブ移行で消したくないケース) を
// Preferences に取り込むためだけに使う。
function readSupabaseCookieChunks(key: string): string | null {
  if (typeof document === "undefined") return null;
  const map = new Map<string, string>();
  for (const raw of document.cookie.split(";")) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    map.set(trimmed.slice(0, eq), trimmed.slice(eq + 1));
  }
  const direct = map.get(key);
  let raw: string | null = direct ?? null;
  if (!raw) {
    const chunks: string[] = [];
    for (let i = 0; ; i++) {
      const v = map.get(`${key}.${i}`);
      if (!v) break;
      chunks.push(v);
    }
    if (chunks.length === 0) return null;
    raw = chunks.join("");
  }
  const decoded = decodeURIComponent(raw);
  if (!decoded.startsWith("base64-")) return decoded;
  try {
    const b64 = decoded.slice("base64-".length);
    const norm = b64.replace(/-/g, "+").replace(/_/g, "/");
    const pad = norm + "=".repeat((4 - (norm.length % 4)) % 4);
    const bin = atob(pad);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch {
    return decoded;
  }
}

// Capacitor Preferences をラップした Supabase の auth.storage アダプタ。
// 読みは Preferences 最優先。Preferences に無く、かつ auth token key のときだけ
// Cookie から救済読みして Preferences に書き戻す (= 初回起動時の移行)。
const PreferencesStorage = {
  async getItem(key: string): Promise<string | null> {
    const { Preferences } = await import("@capacitor/preferences");
    const got = await Preferences.get({ key });
    if (got.value) return got.value;
    if (key === AUTH_TOKEN_KEY) {
      const fromCookie = readSupabaseCookieChunks(key);
      if (fromCookie) {
        await Preferences.set({ key, value: fromCookie });
        return fromCookie;
      }
    }
    return null;
  },
  async setItem(key: string, value: string): Promise<void> {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.set({ key, value });
  },
  async removeItem(key: string): Promise<void> {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.remove({ key });
  },
};

let cachedNativeClient: SupabaseClient | null = null;
function getNativeClient(): SupabaseClient {
  if (cachedNativeClient) return cachedNativeClient;
  cachedNativeClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: PreferencesStorage,
      storageKey: AUTH_TOKEN_KEY,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });
  return cachedNativeClient;
}

// ネイティブ (Capacitor WebView): createClient + Preferences で永続化。
// iOS WKWebView / Android WebView の Cookie が ITP やアプリ再起動で消える問題を回避する。
// それ以外 (Web ブラウザ / SSR): 従来通り @supabase/ssr の createBrowserClient (Cookie 保存)。
// isCapacitorNative() が SSR で false を返すので、サーバー側は browser client の
// no-op パスを通る (SSR の auth 判定は supabaseServer.ts 側を使う)。
export const supabase: SupabaseClient = isCapacitorNative()
  ? getNativeClient()
  : createBrowserClient(supabaseUrl, supabaseAnonKey);
