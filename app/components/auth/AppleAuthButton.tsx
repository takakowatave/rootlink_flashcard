"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { isInAppBrowser } from "@/lib/isInAppBrowser";
import { isNativePlatform } from "@/lib/isNativePlatform";
import { isAndroidPlatform } from "@/lib/isAndroidPlatform";

const NATIVE_REDIRECT = "com.rootlink.app://auth-callback";

// Supabase Providers → Apple 設定完了 (2026-09-05)。有効化。
const APPLE_DISABLED = false;

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
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    setInAppBrowser(isInAppBrowser());
    setIsAndroid(isAndroidPlatform());
    setMounted(true);
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAnonymous(user?.is_anonymous === true);
    });
  }, []);

  // Android アプリでは Apple ボタン自体を出さない (Web / iOS は今までどおり)。
  if (!mounted || isAndroid) return null;

  const handleClick = async () => {
    if (APPLE_DISABLED || inAppBrowser) return;
    const native = isNativePlatform();
    const redirectTo = native ? NATIVE_REDIRECT : `${window.location.origin}/callback`;
    try {
      // ゲスト学習データを引き継ぐための linkIdentity は signup 導線のときだけ。
      // 「ログイン」は既存アカウントへの切替なので、ゲストでも signInWithOAuth に揃える。
      // ログインから linkIdentity を呼ぶと、既存の別アカウントと email が衝突したとき
      // Supabase 側で email_exists が返るだけでユーザーには何も伝わらない事故につながる。
      // signup から linkIdentity → 衝突時は /callback の GuestLinkConfirmDialog 経路に流す
      // ため、provider を sessionStorage に残しておく (callback 側で読む)。
      const shouldLinkIdentity = isAnonymous && variant === "signup";
      if (shouldLinkIdentity) {
        try { sessionStorage.setItem("rootlink_pending_oauth_link", "apple"); } catch {}
      }
      const { data, error } = shouldLinkIdentity
        ? await supabase.auth.linkIdentity({
            provider: "apple",
            options: { redirectTo, skipBrowserRedirect: true },
          })
        : await supabase.auth.signInWithOAuth({
            provider: "apple",
            options: { redirectTo, skipBrowserRedirect: true },
          });
      if (error || !data?.url) {
        onError?.(ERROR_MESSAGE[variant]);
        return;
      }
      if (native) {
        const { Browser } = await import("@capacitor/browser");
        // presentationStyle 未指定 = fullscreen (= UIModalPresentationFullScreen)。
        // 以前は "popover" を指定していたが、iPad では preferredContentSize 無し popover が
        // iPadOS 17+ で表示破綻し (ほぼ透明 / 空枠) 審査担当に「blank page」と見える不具合
        // につながっていた (2026-10 App Review 却下)。
        await Browser.open({ url: data.url });
      } else {
        window.location.href = data.url;
      }
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
