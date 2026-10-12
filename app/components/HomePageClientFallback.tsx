"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { isNativePlatform } from "@/lib/isNativePlatform";
import Dashboard from "./Dashboard";
import LPClient from "./LPClient";

type Decision = "loading" | "web" | "native-authed" | "native-guest";

/**
 * `app/page.tsx` が「サーバー側で auth cookie が見えない」ケースで使うフォールバック。
 *
 * ネイティブ (Capacitor WebView) ではセッションは Preferences に保存するため、
 * SSR では常に Cookie 無し → Dashboard に飛ばせない → この fallback が呼ばれる。
 * クライアントで `supabase.auth.getSession()` を叩き、Preferences からセッションが
 * 復元できたら Dashboard を描画、できなければ /onboarding に逃がす。
 *
 * Web (ブラウザ) ではこの fallback は「未ログイン」のケースだけ到達するので、
 * 従来通り LPClient を描画する。
 */
export default function HomePageClientFallback() {
  const router = useRouter();
  const [decision, setDecision] = useState<Decision>("loading");

  useEffect(() => {
    if (!isNativePlatform()) {
      setDecision("web");
      return;
    }
    let cancelled = false;
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return;
        if (session?.user) {
          setDecision("native-authed");
          return;
        }
        setDecision("native-guest");
        router.replace("/onboarding");
      })
      .catch(() => {
        if (cancelled) return;
        setDecision("native-guest");
        router.replace("/onboarding");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (decision === "loading") return null;
  if (decision === "native-authed") return <Dashboard />;
  if (decision === "native-guest") return null;
  return <LPClient />;
}
