"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { isInAppBrowser } from "@/lib/isInAppBrowser";
import { isNativePlatform } from "@/lib/isNativePlatform";
import { isAndroidPlatform } from "@/lib/isAndroidPlatform";

const NATIVE_REDIRECT = "com.rootlink.app://auth-callback";

// Supabase Providers → Apple 設定完了 (2026-09-05)。有効化。
const APPLE_DISABLED = false;

// ネイティブ Sign in with Apple の Client ID (= iOS Bundle ID)。
// Supabase の Auth → Providers → Apple の "Client IDs" に、Web 用の Services ID
// に加えてこの Bundle ID も登録しておく必要がある (idToken の aud クレームが
// Bundle ID になるため)。
const APPLE_NATIVE_CLIENT_ID = "com.rootlink.app";

type Variant = "signup" | "login";

// Web (/login /signup) は従来どおり signup / login で分けるが、
// ネイティブ (NativeAuthForm) は Figma 2613-6938 準拠で単に "Apple" とだけ出す。
const LABEL_WEB: Record<Variant, string> = {
  signup: "Appleで登録",
  login: "Appleでログイン",
};
const LABEL_NATIVE = "Apple";

const ERROR_MESSAGE: Record<Variant, string> = {
  signup: "Apple登録に失敗しました。時間をおいて再試行してください",
  login: "Appleログインに失敗しました。時間をおいて再試行してください",
};

// @capgo/capacitor-social-login の initialize は一度だけで良いので、
// モジュールスコープの Promise にキャッシュしてボタンマウントごとに走らせない。
// SSR では evaluate しないよう、呼び出し側で typeof window !== 'undefined' を担保する。
let socialLoginInitPromise: Promise<void> | null = null;
async function ensureSocialLoginInitialized(): Promise<void> {
  if (socialLoginInitPromise) return socialLoginInitPromise;
  socialLoginInitPromise = (async () => {
    const { SocialLogin } = await import("@capgo/capacitor-social-login");
    // iOS では redirectUrl は空文字で OK (ネイティブはカスタムスキーム戻りを
    // 使わず直接 identityToken がコールバックで返る)。
    await SocialLogin.initialize({
      apple: {
        clientId: APPLE_NATIVE_CLIENT_ID,
        redirectUrl: "",
      },
    });
  })().catch((err) => {
    // 初期化失敗時は次回のタップで再試行できるようキャッシュを捨てる
    socialLoginInitPromise = null;
    throw err;
  });
  return socialLoginInitPromise;
}

// Apple は options.nonce に SHA256 ハッシュ (16 進) を受け取り、
// 返す idToken の nonce クレームにそのハッシュを埋める。
// Supabase 側には「ハッシュする前の平文 nonce」を渡して検証させる。
function toHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
}
function generatePlainNonce(): string {
  // 128bit ランダム (crypto.randomUUID があればそれで十分)
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return toHex(arr.buffer);
}

// Apple ネイティブサインインのキャンセル判定。
// ASAuthorizationError.canceled は code=1001。plugin が code をそのまま載せる場合と、
// message に "cancel" を含める場合の両方を拾う。
function isNativeAppleCancel(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: unknown; message?: unknown };
  if (e.code === "1001" || e.code === 1001) return true;
  const msg = typeof e.message === "string" ? e.message.toLowerCase() : "";
  return /cancel/.test(msg);
}

export default function AppleAuthButton({
  variant,
  onError,
}: {
  variant: Variant;
  onError?: (message: string) => void;
}) {
  const [inAppBrowser, setInAppBrowser] = useState(false);
  // SSR / 初回レンダーは false → 初回ペイントで一瞬 Android にも出るのを避ける
  // ため、mounted になるまでは描画しない。マウント後に platform を判定する。
  const [mounted, setMounted] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    setInAppBrowser(isInAppBrowser());
    setIsAndroid(isAndroidPlatform());
    setMounted(true);
  }, []);

  // Android アプリでは Apple ボタン自体を出さない (Web / iOS は今までどおり)。
  if (!mounted || isAndroid) return null;

  const handleClick = async () => {
    if (APPLE_DISABLED || inAppBrowser) return;
    const native = isNativePlatform();

    // ネイティブ (iOS): OS 標準の Sign in with Apple シートを出す。
    //
    // SFSafariViewController (= @capacitor/browser) 経由の signInWithOAuth /
    // linkIdentity は、Apple が response_mode=form_post で返した後の 302 で
    // カスタムスキームへ戻せない (iOS WebKit のセキュリティ制限により
    // POST レスポンスの 302 ではカスタムスキーム遷移が抑止される) ため、
    // サインインが Supabase 側で成功してもアプリに戻って来ない。
    //
    // 代わりに AuthenticationServices (ASAuthorizationAppleIDProvider) を
    // プラグイン経由で直接呼び、取得した idToken を Supabase に渡す。
    // この経路なら「ゲスト学習データの引き継ぎ」(linkIdentity) は走らない。
    // kiko 承認: signup / login どちらでも学習データは引き継がない方針 A。
    if (native) {
      try {
        await ensureSocialLoginInitialized();
        const { SocialLogin } = await import("@capgo/capacitor-social-login");
        const plainNonce = generatePlainNonce();
        const hashedNonce = await sha256Hex(plainNonce);
        const loginRes = await SocialLogin.login({
          provider: "apple",
          options: {
            scopes: ["email", "name"],
            nonce: hashedNonce,
          },
        });
        if (loginRes.provider !== "apple") {
          onError?.(ERROR_MESSAGE[variant]);
          return;
        }
        const idToken = loginRes.result.idToken;
        if (!idToken) {
          onError?.(ERROR_MESSAGE[variant]);
          return;
        }
        const { error: supaErr } = await supabase.auth.signInWithIdToken({
          provider: "apple",
          token: idToken,
          nonce: plainNonce,
        });
        if (supaErr) {
          onError?.(ERROR_MESSAGE[variant]);
          return;
        }
        // profile 補完・sign_up_complete 計測は /callback 側に集約してあるので
        // そこを経由してからホームへ流す。
        window.location.href = "/callback";
      } catch (err) {
        if (isNativeAppleCancel(err)) {
          // キャンセルは静かに戻す (トーストもエラー表示も出さない)
          return;
        }
        onError?.(ERROR_MESSAGE[variant]);
      }
      return;
    }

    // Web: 従来通り signInWithOAuth で OAuth リダイレクトに流す。
    const redirectTo = `${window.location.origin}/callback`;
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error || !data?.url) {
        onError?.(ERROR_MESSAGE[variant]);
        return;
      }
      window.location.href = data.url;
    } catch {
      onError?.(ERROR_MESSAGE[variant]);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={APPLE_DISABLED || inAppBrowser}
      className="w-full h-12 px-4 bg-black border border-black rounded-md hover:bg-gray-900 flex items-center justify-center gap-2 text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/apple-icon.svg" className="w-5 h-5" alt="Apple" />
      {APPLE_DISABLED
        ? `${isNativePlatform() ? LABEL_NATIVE : LABEL_WEB[variant]}（テスト中につき不可）`
        : (isNativePlatform() ? LABEL_NATIVE : LABEL_WEB[variant])}
    </button>
  );
}
