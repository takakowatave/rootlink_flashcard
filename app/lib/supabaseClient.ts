import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ネイティブ (iOS WKWebView / Android WebView) ではセッションの保存先を
// Capacitor Preferences 一本にする。
//
// 旧実装は document.cookie と Preferences の二重保存 + 毎 getAll() で
// reconcileAndReadAll していた。iOS ITP で cookie が chunk 単位でサイレント
// 失効すると「Pref に揃っている / Cookie に欠けがある」判定で毎回 Cookie を
// 書き戻し、@supabase/ssr がその書き換えを「セッション差し替え」と見て
// refreshSession を連打 → /token が1秒3〜4回で 429 に到達する事故があった
// (App Store 審査 2026-10-13、iPad Air 11-inch M3 / iPadOS 27.0)。
//
// 保存先を Preferences だけにすれば、Cookie の書き戻しも reconcile もなくなり
// 短時間連打の経路が消える。document.cookie への読み書きは一切しない。
//
// SSR / middleware は native の HTTP には届かない (WebView は server.url で
// 本番 Web をそのまま読む) ので、サーバー側の auth cookie 依存を失うことで
// 壊れる経路はない。app/page.tsx の server-side getUser() が null になる場合は
// HomePageClientFallback が client 側で復元する既存フォールバックで吸収される。
//
// Preferences プラグインが同梱されていない旧バイナリ (ビルド 4 以前) で新しい
// Web が走ったときに Preferences 版の adapter を使うと import で落ちるので、
// Capacitor.isPluginAvailable('Preferences') が true のときだけ切り替える。
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
    maxAge?: number;
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

// 旧バイナリ (ビルド 4 以前) でサインイン済みのユーザーが新バイナリに更新した
// ときに document.cookie から Preferences へ一度だけコピーする。移行完了は
// `rootlink-cookies-migrated` キーで印を打ち、次回以降は走らせない。
// Cookie→Pref の片道一回だけ。Pref を書いたあとは Cookie に戻さない。
const MIGRATION_FLAG_KEY = "rootlink-cookies-migrated";

async function migrateCookiesToPreferencesOnce(): Promise<{ name: string; value: string }[]> {
  if (typeof document === "undefined") return [];
  try {
    const { Preferences } = await import("@capacitor/preferences");
    const flag = await Preferences.get({ key: MIGRATION_FLAG_KEY });
    if (flag.value) return [];
    const picked: { name: string; value: string }[] = [];
    for (const part of document.cookie.split(";")) {
      const eq = part.indexOf("=");
      if (eq < 0) continue;
      const name = part.slice(0, eq).trim();
      if (!name.startsWith("sb-")) continue;
      const rawValue = part.slice(eq + 1).trim();
      let value = rawValue;
      try {
        value = decodeURIComponent(rawValue);
      } catch {
        // noop
      }
      await Preferences.set({ key: name, value });
      picked.push({ name, value });
    }
    await Preferences.set({ key: MIGRATION_FLAG_KEY, value: "1" });
    return picked;
  } catch {
    return [];
  }
}

function createNativeClient(): SupabaseClient {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      async getAll() {
        const prefs = await readPreferencesCookies();
        if (prefs.length > 0) return prefs;
        // Preferences が空 → 一度だけ Cookie から拾って移行する。
        // 2 回目以降は MIGRATION_FLAG_KEY があるので空配列で返る。
        return migrateCookiesToPreferencesOnce();
      },
      async setAll(cookies) {
        await writePreferencesCookies(cookies);
      },
    },
  });
}

export const supabase: SupabaseClient = isPreferencesAvailable()
  ? createNativeClient()
  : createBrowserClient(supabaseUrl, supabaseAnonKey);
