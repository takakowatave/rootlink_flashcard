"use client";

import { useState } from "react";
import { useDisplayLocale } from "@/lib/useDisplayLocale";

type Variant = "signup" | "login";

const HEADING_JA: Record<Variant, string> = {
  signup: "Google・Apple 登録をご利用の方へ",
  login: "Google・Apple ログインをご利用の方へ",
};
const HEADING_EN: Record<Variant, string> = {
  signup: "If you want to sign up with Google / Apple",
  login: "If you want to log in with Google / Apple",
};

const BODY_JA: Record<Variant, string> = {
  signup: "このアプリ内ブラウザでは Google / Apple の仕様により登録できません。",
  login: "このアプリ内ブラウザでは Google / Apple の仕様によりログインできません。",
};
const BODY_EN: Record<Variant, string> = {
  signup: "This in-app browser cannot sign up with Google / Apple due to their restrictions.",
  login: "This in-app browser cannot log in with Google / Apple due to their restrictions.",
};

export default function InAppBrowserNotice({ variant }: { variant: Variant }) {
  const locale = useDisplayLocale();
  const L = locale === 'en'
    ? { copy: 'Copy URL', copied: 'Copied', copyFailed: 'Copy failed', openNote: 'Please reopen this page in Safari or Chrome.' }
    : { copy: 'URLをコピー', copied: 'コピーしました', copyFailed: 'コピー失敗', openNote: 'Safari や Chrome で開き直してください。' };
  const HEADING = locale === 'en' ? HEADING_EN : HEADING_JA;
  const BODY = locale === 'en' ? BODY_EN : BODY_JA;
  const [copyLabel, setCopyLabel] = useState(L.copy);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyLabel(L.copied);
      setTimeout(() => setCopyLabel(L.copy), 2000);
    } catch {
      setCopyLabel(L.copyFailed);
      setTimeout(() => setCopyLabel(L.copy), 2000);
    }
  };

  return (
    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-md text-xs text-gray-700 leading-relaxed">
      <p className="font-semibold mb-1">{HEADING[variant]}</p>
      <p className="mb-2">
        {BODY[variant]}
        <br />
        {L.openNote}
      </p>
      <button onClick={handleCopy} className="text-primary underline text-xs">
        {copyLabel}
      </button>
    </div>
  );
}
