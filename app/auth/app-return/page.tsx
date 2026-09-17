'use client'

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Button";
import AuthPage from "@/components/auth/AuthPage";
import AuthCard from "@/components/auth/AuthCard";

// Supabase の verify から 303 でここへ戻し、ユーザータップで
// com.rootlink.app://auth-callback へ渡し直す中継ページ。
// Chrome は 303 でのカスタムスキーム起動を許可しないため、
// 一度 https の実ページを踏んでからユーザー操作で deeplink を開く。
//
// クエリパラメータはそのまま deeplink に転送する。
//   - 新: ?token_hash=XXX&type=signup|recovery|email_change
//   - 旧: ?code=XXX
// いずれも AppShell.appUrlOpen 側で受けて verifyOtp / exchangeCodeForSession を叩く。
const DEEP_LINK_BASE = "com.rootlink.app://auth-callback";

export default function AppReturn() {
  const [hasError, setHasError] = useState(false);
  const [deepLink, setDeepLink] = useState<string>(DEEP_LINK_BASE);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const urlError =
      url.searchParams.get("error_description") ||
      url.searchParams.get("error");
    if (urlError) {
      setHasError(true);
      return;
    }
    const link = `${DEEP_LINK_BASE}${url.search}${url.hash}`;
    setDeepLink(link);
    // 自動で開こうと試みる。Chrome はユーザー操作なしでの
    // カスタムスキーム遷移をブロックすることがあるため、失敗時に
    // 下のボタンを踏んでもらう前提。
    window.location.href = link;
  }, []);

  const buttonHref = useMemo(() => deepLink, [deepLink]);

  if (hasError) {
    return (
      <AuthPage>
        <AuthCard title="リンクの有効期限が切れているか、すでに使われています">
          <p className="text-base text-gray-950 leading-relaxed text-center mb-6">
            メール認証はすでに完了している可能性があります。
            <br />
            そのままログインしてご利用ください。
          </p>
          <Button
            onClick={() => {
              window.location.href = "/login";
            }}
            variant="primary"
            size="md"
            radius="lg"
            fullWidth
          >
            ログイン画面へ
          </Button>
        </AuthCard>
      </AuthPage>
    );
  }

  return (
    <AuthPage>
      <AuthCard title="RootLink アプリに戻る">
        <p className="text-base text-gray-950 leading-relaxed text-center mb-6">
          自動でアプリに戻らない場合は、下のボタンから開いてください。
        </p>
        <a href={buttonHref} className="block">
          <Button variant="primary" size="md" radius="lg" fullWidth>
            RootLink アプリを開く
          </Button>
        </a>
      </AuthCard>
    </AuthPage>
  );
}
