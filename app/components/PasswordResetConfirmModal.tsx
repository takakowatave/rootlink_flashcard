"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Button from "./Button";

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
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
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
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="tertiary"
            size="sm"
            onClick={onClose}
            disabled={submitting}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "送信中..." : "送信"}
          </Button>
        </div>
      </div>
    </div>
  );
}
