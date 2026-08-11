"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { isInAppBrowser } from "@/lib/isInAppBrowser";
import InAppBrowserNotice from "./InAppBrowserNotice";

type Variant = "signup" | "login";

const LABEL: Record<Variant, string> = {
  signup: "Googleで登録",
  login: "Googleでログイン",
};

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

  useEffect(() => {
    setInAppBrowser(isInAppBrowser());
  }, []);

  const handleClick = async () => {
    if (inAppBrowser) return;
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/callback`,
          skipBrowserRedirect: true,
        },
      });
      if (error) {
        onError?.(ERROR_MESSAGE[variant]);
        return;
      }
      if (data?.url) {
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
        className="w-full h-12 px-4 bg-white border border-line rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/google-icon.svg" className="w-5 h-5" alt="Google" />
        {LABEL[variant]}
      </button>
    </>
  );
}
