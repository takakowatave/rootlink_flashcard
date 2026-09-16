'use client'

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Button from "@/components/Button";

// Supabase の verify から 303 でここへ戻し、ユーザータップで
// com.rootlink.app://auth-callback へ渡し直す中継ページ。
// Chrome は 303 でのカスタムスキーム起動を許可しないため、
// 一度 https の実ページを踏んでからユーザー操作で deeplink を開く。
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
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-3">
          認証に失敗しました
        </h1>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          リンクの有効期限が切れているか、無効になっている可能性があります。
          <br />
          もう一度お試しください。
        </p>
        <div className="flex items-center justify-center gap-6 text-sm">
          <Link href="/login" className="text-primary underline">
            ログイン
          </Link>
          <Link href="/signup" className="text-primary underline">
            新規登録
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16 text-center">
      <h1 className="text-xl font-semibold text-gray-900 mb-3">
        メール認証が完了しました
      </h1>
      <p className="text-sm text-gray-600 mb-6 leading-relaxed">
        RootLinkアプリに戻って続きの操作を行ってください。
      </p>
      <div className="flex items-center justify-center">
        <a href={buttonHref}>
          <Button variant="primary">RootLinkアプリを開く</Button>
        </a>
      </div>
    </div>
  );
}
