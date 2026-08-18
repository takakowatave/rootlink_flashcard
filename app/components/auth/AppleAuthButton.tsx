"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { isInAppBrowser } from "@/lib/isInAppBrowser";
import { isNativePlatform } from "@/lib/isNativePlatform";
import InAppBrowserNotice from "./InAppBrowserNotice";

const NATIVE_REDIRECT = "com.rootlink.app://auth-callback";

type Variant = "signup" | "login";

const LABEL: Record<Variant, string> = {
  signup: "Appleで登録",
  login: "Appleでログイン",
};

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

  useEffect(() => {
    setInAppBrowser(isInAppBrowser());
  }, []);

  const handleClick = async () => {
    if (inAppBrowser) return;
    const native = isNativePlatform();
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: native ? NATIVE_REDIRECT : `${window.location.origin}/callback`,
          skipBrowserRedirect: true,
        },
      });
      if (error || !data?.url) {
        onError?.(ERROR_MESSAGE[variant]);
        return;
      }
      if (native) {
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url: data.url, presentationStyle: "popover" });
      } else {
        window.location.href = data.url;
      }
    } catch {
      onError?.(ERROR_MESSAGE[variant]);
    }
  };

  return (
    <>
      {inAppBrowser && <InAppBrowserNotice variant={variant} />}
      <button
        onClick={handleClick}
        disabled={inAppBrowser}
        className="w-full h-12 px-4 bg-black border border-black rounded-md hover:bg-gray-900 flex items-center justify-center gap-2 text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/apple-icon.svg" className="w-5 h-5" alt="Apple" />
        {LABEL[variant]}
      </button>
    </>
  );
}
