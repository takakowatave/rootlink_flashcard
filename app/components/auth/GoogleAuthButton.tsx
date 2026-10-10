"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { isInAppBrowser } from "@/lib/isInAppBrowser";
import { isNativePlatform } from "@/lib/isNativePlatform";

const NATIVE_REDIRECT = "com.rootlink.app://auth-callback";

type Variant = "signup" | "login";

// Web (/login /signup) は従来どおり signup / login で文言を分けるが、
// ネイティブ (NativeAuthForm) は Figma 2613-6938 準拠で単に "Google" とだけ出す。
const LABEL_WEB: Record<Variant, string> = {
  signup: "Googleで登録",
  login: "Googleでログイン",
};
const LABEL_NATIVE = "Google";

const ERROR_MESSAGE: Record<Variant, string> = {
  signup: "Google登録に失敗しました。時間をおいて再試行してください",
  login: "Googleログインに失敗しました。時間をおいて再試行してください",
};

export default function GoogleAuthButton({
  variant,
  onError,
}: {
  variant: Variant;
  onError?: (message: string) => void;
}) {
  const [inAppBrowser, setInAppBrowser] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setInAppBrowser(isInAppBrowser());
    setIsNative(isNativePlatform());
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAnonymous(user?.is_anonymous === true);
    });
  }, []);

  const handleClick = async () => {
    if (inAppBrowser) return;
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
        try { sessionStorage.setItem("rootlink_pending_oauth_link", "google"); } catch {}
      }
      const call = shouldLinkIdentity
        ? supabase.auth.linkIdentity({
            provider: "google",
            options: { redirectTo, skipBrowserRedirect: true },
          })
        : supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo, skipBrowserRedirect: true },
          });
      const { data, error } = await call;
      if (error || !data?.url) {
        onError?.(ERROR_MESSAGE[variant]);
        return;
      }
      if (native) {
        const { Browser } = await import("@capacitor/browser");
        // presentationStyle 未指定 = fullscreen。popover 指定時は iPad で表示破綻する
        // (AppleAuthButton と同じ事故。2026-10 App Review 却下)。
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
      disabled={inAppBrowser}
      className="w-full h-12 px-4 bg-white border border-line rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/google-icon.svg" className="w-5 h-5" alt="Google" />
      {isNative ? LABEL_NATIVE : LABEL_WEB[variant]}
    </button>
  );
}
