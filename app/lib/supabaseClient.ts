import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ネイティブ (iOS WKWebView / Android WebView) では JS が書いた Cookie が
// ITP でアプリ再起動時に消え、ログアウトされてしまう (iOS は JS Cookie を
// 最長 7 日に制限)。Capacitor Preferences を正本にして、Cookie はミラーに
// してしまえば、Cookie が消えても Preferences からセッションを復元できる。
//
// 既にログイン中のユーザーが更新で突然ログアウトされないよう、getAll は
// document.cookie と Preferences を両方読み、Preferences 側を上書き優先に
// する。Cookie だけに session がある旧ユーザーは最初の token refresh で
// setAll 経由で Preferences に同期される (= 透過マイグレーション)。
//
// ただし Preferences プラグインが同梱されていない旧バイナリ (Play ストア配布中の
// 旧 Android / App Store にアップロード済みの iOS ビルド 4 以前) で新しい Web が
// 走ったとき、Preferences 版の cookies アダプタに切り替えてしまうと内部で
// 「Plugin not available」で落ちてログインが壊れる。
// Capacitor.isPluginAvailable('Preferences') が true のときだけ native 版に切り替え、
// それ以外は従来通り素の createBrowserClient (document.cookie) を使う。
function isPreferencesAvailable(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      isPluginAvailable?: (name: string) => boolean;
    };
  }).Capacitor;
  if (typeof cap?.isNativePlatform !== "function") return false;
  if (!cap.isNativePlatform()) return false;
  if (typeof cap.isPluginAvailable !== "function") return false;
  try {
    return cap.isPluginAvailable("Preferences");
  } catch {
    return false;
  }
}

type CookieToSet = {
  name: string;
  value: string;
  options?: {
    path?: string;
    domain?: string;
    maxAge?: number;
    expires?: Date | string | number;
    sameSite?: boolean | "lax" | "strict" | "none";
    secure?: boolean;
    httpOnly?: boolean;
  };
};

async function readPreferencesCookies(): Promise<{ name: string; value: string }[]> {
  try {
    const { Preferences } = await import("@capacitor/preferences");
    const { keys } = await Preferences.keys();
    const out: { name: string; value: string }[] = [];
    for (const key of keys) {
      if (!key.startsWith("sb-")) continue;
      const { value } = await Preferences.get({ key });
      if (value !== null && value !== undefined) out.push({ name: key, value });
    }
    return out;
  } catch {
    return [];
  }
}

async function writePreferencesCookies(cookies: CookieToSet[]) {
  try {
    const { Preferences } = await import("@capacitor/preferences");
    for (const c of cookies) {
      if (!c.name.startsWith("sb-")) continue;
      const expired = c.options?.maxAge === 0 || c.value === "";
      if (expired) {
        await Preferences.remove({ key: c.name });
      } else {
        await Preferences.set({ key: c.name, value: c.value });
      }
    }
  } catch {
    // noop
  }
}

function readDocumentCookies(): { name: string; value: string }[] {
  if (typeof document === "undefined" || !document.cookie) return [];
  const out: { name: string; value: string }[] = [];
  for (const part of document.cookie.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const name = part.slice(0, eq).trim();
    const rawValue = part.slice(eq + 1).trim();
    if (!name) continue;
    try {
      out.push({ name, value: decodeURIComponent(rawValue) });
    } catch {
      out.push({ name, value: rawValue });
    }
  }
  return out;
}

function writeDocumentCookies(cookies: CookieToSet[]) {
  if (typeof document === "undefined") return;
  for (const c of cookies) {
    const o = c.options ?? {};
    const parts = [`${c.name}=${encodeURIComponent(c.value)}`];
    parts.push(`path=${o.path ?? "/"}`);
    if (o.domain) parts.push(`domain=${o.domain}`);
    if (typeof o.maxAge === "number") parts.push(`max-age=${o.maxAge}`);
    if (o.expires) {
      const d =
        o.expires instanceof Date ? o.expires : new Date(o.expires);
      parts.push(`expires=${d.toUTCString()}`);
    }
    if (o.sameSite) {
      const v = typeof o.sameSite === "string" ? o.sameSite : "lax";
      parts.push(`SameSite=${v}`);
    }
    if (o.secure) parts.push("Secure");
    document.cookie = parts.join("; ");
  }
}

// Cookie と Preferences の内容が食い違っていたら両方向に揃える。
// - Cookie だけに session が残っている旧ユーザー (更新前にログイン済み) → Preferences に書き込む
// - Preferences だけに session がある (Cookie は ITP で purge) → Cookie に書き戻して SSR も通す
function mirrorMissing(
  prefs: { name: string; value: string }[],
  browser: { name: string; value: string }[],
) {
  const prefMap = new Map(prefs.map((c) => [c.name, c.value]));
  const browserMap = new Map(browser.map((c) => [c.name, c.value]));
  const toCookie: CookieToSet[] = [];
  const toPrefs: CookieToSet[] = [];
  for (const [name, value] of prefMap) {
    if (browserMap.get(name) !== value) {
      toCookie.push({
        name,
        value,
        options: {
          path: "/",
          sameSite: "lax",
          secure: true,
          maxAge: 60 * 60 * 24 * 365,
        },
      });
    }
  }
  for (const [name, value] of browserMap) {
    if (!name.startsWith("sb-")) continue;
    if (prefMap.get(name) !== value) {
      toPrefs.push({ name, value });
    }
  }
  if (toCookie.length) writeDocumentCookies(toCookie);
  if (toPrefs.length) void writePreferencesCookies(toPrefs);
}

function createNativeClient(): SupabaseClient {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      async getAll() {
        const [prefs, browser] = await Promise.all([
          readPreferencesCookies(),
          Promise.resolve(readDocumentCookies()),
        ]);
        mirrorMissing(prefs, browser);
        const merged = new Map<string, string>();
        for (const c of browser) merged.set(c.name, c.value);
        for (const c of prefs) merged.set(c.name, c.value);
        return Array.from(merged, ([name, value]) => ({ name, value }));
      },
      async setAll(cookies) {
        writeDocumentCookies(cookies);
        await writePreferencesCookies(cookies);
      },
    },
  });
}

export const supabase: SupabaseClient = isPreferencesAvailable()
  ? createNativeClient()
  : createBrowserClient(supabaseUrl, supabaseAnonKey);
