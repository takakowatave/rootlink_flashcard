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

// Supabase の auth cookie は chunked されることがある:
//   sb-<ref>-auth-token            (非 chunked)
//   sb-<ref>-auth-token.0, .1, ... (chunked)
// どちらの形式も「同じ base name のまとまり」として扱わないと、chunk の一部だけ
// 新旧混在する事故 (Preferences の .2 が残って Cookie の .0 .1 と混ざる等) が起きる。
function baseKeyOf(name: string): string {
  const m = name.match(/^(sb-.+?)\.(\d+)$/);
  return m ? m[1] : name;
}

type Entry = { name: string; value: string };

function groupAuthEntries(entries: Entry[]) {
  const groups = new Map<string, Entry[]>();
  const nonAuth: Entry[] = [];
  for (const e of entries) {
    if (!e.name.startsWith("sb-")) {
      nonAuth.push(e);
      continue;
    }
    const base = baseKeyOf(e.name);
    const g = groups.get(base) ?? [];
    g.push(e);
    groups.set(base, g);
  }
  return { groups, nonAuth };
}

// Cookie を「正」、Preferences は「Cookie が消えたときの予備」として扱う。
//   - base name 単位 (= 同じ `sb-<ref>-auth-token` の chunk 一式) で判定する。
//   - Cookie 側にその base の値が 1 つでも有れば → Cookie を使い、Preferences を
//     その base について Cookie の内容へ揃える (Pref にしかない旧 chunk は削除)。
//   - Cookie 側に無く Preferences にだけ有れば (ITP やアプリ再起動で Cookie が消えた
//     ケース) → Preferences の値を使い、Cookie に書き戻して SSR / middleware にも
//     見えるようにする。
// 「Preferences 優先」にしてしまうと、/verify や SSR のルートがサーバー側で Cookie
// だけに新しい session を書き込んだとき、Preferences の古いゲスト session で
// 上書きされて確認直後にゲストに戻る事故が起きるため、必ず Cookie 側を正にする。
async function reconcileAndReadAll(
  prefs: Entry[],
  browser: Entry[],
): Promise<Entry[]> {
  const prefInfo = groupAuthEntries(prefs);
  const browserInfo = groupAuthEntries(browser);
  const result: Entry[] = [...browserInfo.nonAuth];

  const toCookie: CookieToSet[] = [];
  const toPrefsSet: Entry[] = [];
  const toPrefsDelete: string[] = [];

  const allBases = new Set<string>([
    ...browserInfo.groups.keys(),
    ...prefInfo.groups.keys(),
  ]);

  for (const base of allBases) {
    const cookieGroup = browserInfo.groups.get(base) ?? [];
    const prefGroup = prefInfo.groups.get(base) ?? [];
    if (cookieGroup.length > 0) {
      // Cookie が authoritative。Preferences をこの base の cookie 内容へ揃える。
      result.push(...cookieGroup);
      const cookieByName = new Map(cookieGroup.map((e) => [e.name, e.value]));
      const prefByName = new Map(prefGroup.map((e) => [e.name, e.value]));
      // Pref にしか無い chunk は削除 (= この base の過去の chunk 残骸)
      for (const [name] of prefByName) {
        if (!cookieByName.has(name)) toPrefsDelete.push(name);
      }
      // Cookie の値を Pref へ反映
      for (const [name, value] of cookieByName) {
        if (prefByName.get(name) !== value) {
          toPrefsSet.push({ name, value });
        }
      }
    } else if (prefGroup.length > 0) {
      // Cookie に無く Preferences だけに有る → Pref を使い、Cookie に書き戻す。
      result.push(...prefGroup);
      for (const p of prefGroup) {
        toCookie.push({
          name: p.name,
          value: p.value,
          options: {
            path: "/",
            sameSite: "lax",
            secure: true,
            maxAge: 60 * 60 * 24 * 365,
          },
        });
      }
    }
  }

  if (toCookie.length) writeDocumentCookies(toCookie);
  if (toPrefsSet.length || toPrefsDelete.length) {
    void (async () => {
      try {
        const { Preferences } = await import("@capacitor/preferences");
        for (const key of toPrefsDelete) {
          await Preferences.remove({ key });
        }
        for (const e of toPrefsSet) {
          await Preferences.set({ key: e.name, value: e.value });
        }
      } catch {
        // Preferences が無い旧バイナリでは isPreferencesAvailable で弾かれる想定だが、
        // 万一の import 失敗はログインを壊さないよう黙って無視する。
      }
    })();
  }

  return result;
}

function createNativeClient(): SupabaseClient {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      async getAll() {
        const [prefs, browser] = await Promise.all([
          readPreferencesCookies(),
          Promise.resolve(readDocumentCookies()),
        ]);
        return reconcileAndReadAll(prefs, browser);
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
