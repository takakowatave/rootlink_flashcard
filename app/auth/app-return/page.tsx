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
//
// 二重発火対策: 自動遷移とボタンで同じ token_hash / code が 2 回 deeplink に
// 渡ると、2 回目の verifyOtp が「使用済み」で失敗し失敗画面が出る。
// - 自動遷移は sessionStorage に印を付け、Chrome を戻って再読み込みされても
//   もう飛ばさない。
// - ボタンは 1 回押したら disabled にして 2 回押させない。
const DEEP_LINK_BASE = "com.rootlink.app://auth-callback";
const AUTO_OPENED_PREFIX = "rootlink_app_return_opened:";

export default function AppReturn() {
  const [hasError, setHasError] = useState(false);
  const [deepLink, setDeepLink] = useState<string>(DEEP_LINK_BASE);
  const [buttonUsed, setButtonUsed] = useState(false);
  // Chrome から deeplink でアプリに遷移する典型的なケースでは 1 秒以内に
  // アプリが手前に来て Chrome タブは背景に回る。その前に「認証が完了しました」
  // 「アプリを開く」の card を描画すると 1 秒フラッシュしてユーザーに
  // 「認証失敗」と誤読される。マウント後 1500ms 経ってから初めて card を
  // 出すことで、通常フローでは何も描画されないまま Chrome が背景化する。
  const [showCard, setShowCard] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowCard(true), 1500);
    return () => clearTimeout(t);
  }, []);

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

    // 同一 token / code に対する自動遷移は 1 回だけ。Chrome を戻ってきて
    // 再読み込みされても 2 回目の deeplink 起動をしない (2 回目は AppShell
    // 側の verifyOtp が「使用済み」で失敗するため)。
    const tokenHash = url.searchParams.get("token_hash");
    const code = url.searchParams.get("code");
    const dedupKey = tokenHash
      ? `${AUTO_OPENED_PREFIX}token:${tokenHash}`
      : code
        ? `${AUTO_OPENED_PREFIX}code:${code}`
        : null;
    if (dedupKey) {
      try {
        if (window.sessionStorage.getItem(dedupKey)) {
          // 既に自動遷移済み。ボタンも最初から一度だけ扱いにして誤って
          // もう一度発火しないようにする。
          setButtonUsed(true);
          return;
        }
        window.sessionStorage.setItem(dedupKey, "1");
      } catch {
        // sessionStorage 使用不可 (プライベートブラウズ等) → dedupe を諦めて続行
      }
    }
    // 自動で開こうと試みる。Chrome はユーザー操作なしでの
    // カスタムスキーム遷移をブロックすることがあるため、失敗時に
    // 下のボタンを踏んでもらう前提。
    window.location.href = link;
  }, []);

  const buttonHref = useMemo(() => deepLink, [deepLink]);

  // 1500ms 経つまでは何も描画しない (通常フローでは Chrome が背景化する)。
  if (!showCard) {
    return <AuthPage>{null}</AuthPage>;
  }

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
      <AuthCard title="認証が完了しました">
        <p className="text-base text-gray-950 leading-relaxed text-center mb-6">
          RootLink アプリに戻って続きの操作を行ってください。
          <br />
          自動でアプリに戻らない場合は、下のボタンから開いてください。
        </p>
        {buttonUsed ? (
          <Button
            variant="primary"
            size="md"
            radius="lg"
            fullWidth
            disabled
          >
            アプリを開いています…
          </Button>
        ) : (
          <a
            href={buttonHref}
            onClick={() => setButtonUsed(true)}
            className="block"
          >
            <Button variant="primary" size="md" radius="lg" fullWidth>
              RootLink アプリを開く
            </Button>
          </a>
        )}
      </AuthCard>
    </AuthPage>
  );
}
