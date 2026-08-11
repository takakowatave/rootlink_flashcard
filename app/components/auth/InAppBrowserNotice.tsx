"use client";

import { useState } from "react";

type Variant = "signup" | "login";

const HEADING: Record<Variant, string> = {
  signup: "Google登録をご利用の方へ",
  login: "Googleログインをご利用の方へ",
};

const BODY: Record<Variant, string> = {
  signup: "このアプリ内ブラウザでは Google の仕様により登録できません。",
  login: "このアプリ内ブラウザでは Google の仕様によりログインできません。",
};

export default function InAppBrowserNotice({ variant }: { variant: Variant }) {
  const [copyLabel, setCopyLabel] = useState("URLをコピー");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyLabel("コピーしました");
      setTimeout(() => setCopyLabel("URLをコピー"), 2000);
    } catch {
      setCopyLabel("コピー失敗");
      setTimeout(() => setCopyLabel("URLをコピー"), 2000);
    }
  };

  return (
    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-md text-xs text-gray-700 leading-relaxed">
      <p className="font-semibold mb-1">{HEADING[variant]}</p>
      <p className="mb-2">
        {BODY[variant]}
        <br />
        Safari や Chrome で開き直してください。
      </p>
      <button onClick={handleCopy} className="text-primary underline text-xs">
        {copyLabel}
      </button>
    </div>
  );
}
