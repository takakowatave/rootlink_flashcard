"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { isNativePlatform } from "@/lib/isNativePlatform";
import { setPendingAuthFlow } from "@/lib/pendingAuthFlow";
import Button from "./Button";

// native は中継ページ経由で戻す。Chrome は 303 でカスタムスキームを起こせないため、
// 一度 https の /auth/app-return を踏み、そこでユーザー操作として deeplink を叩く。
const NATIVE_REDIRECT_URL = "https://www.rootlink.app/auth/app-return";

interface Props {
  open: boolean;
  onClose: () => void;
  email: string;
  onSent: () => void;
}

export default function PasswordResetConfirmModal({ open, onClose, email, onSent }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      setError(undefined);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!email) return;
    setSubmitting(true);
    setError(undefined);
    // アプリで始めた場合は deeplink で戻して AppShell 側で reset-password に飛ばす。
    // Web は今までどおり origin の reset-password ページを直接開かせる。
    const redirectTo = isNativePlatform()
      ? NATIVE_REDIRECT_URL
      : `${window.location.origin}/reset-password`;
    if (isNativePlatform()) setPendingAuthFlow("recovery");
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    setSubmitting(false);
    if (err) {
      setError("送信に失敗しました。時間をおいて再試行してください。");
      return;
    }
    onSent();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-gray-950">パスワードの再設定</h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          こちらのアドレスに再設定用メールを送信します。
        </p>
        <p className="text-base font-medium text-primary break-all">{email}</p>
        <p className="text-xs text-gray-500 leading-relaxed">
          リンクをクリックしてパスワードを設定し直してください。
        </p>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <Button
            type="button"
            variant="tertiary"
            size="md"
            onClick={onClose}
            disabled={submitting}
            className="w-full md:w-auto"
          >
            キャンセル
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full md:w-auto"
          >
            {submitting ? "送信中..." : "送信"}
          </Button>
        </div>
      </div>
    </div>
  );
}
