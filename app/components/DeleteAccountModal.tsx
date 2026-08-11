"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Button from "./Button";
import { TextInput } from "./TextInput";

interface Props {
  open: boolean;
  onClose: () => void;
  hasActiveSubscription: boolean;
  onDeleted: () => void;
}

const CONFIRM_WORD = "退会";

const API_BASE =
  process.env.NEXT_PUBLIC_CLOUDRUN_API_URL ??
  "https://rootlink-server-v2-774622345521.asia-northeast1.run.app";

export default function DeleteAccountModal({
  open,
  onClose,
  hasActiveSubscription,
  onDeleted,
}: Props) {
  const [confirmText, setConfirmText] = useState("");
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
      setConfirmText("");
      setError(undefined);
    };
  }, [open, onClose]);

  if (!open) return null;

  const canSubmit = confirmText.trim() === CONFIRM_WORD && !submitting;

  const handleDelete = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(undefined);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError("セッションが無効です。再度ログインしてください。");
        setSubmitting(false);
        return;
      }
      const res = await fetch(`${API_BASE}/auth/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError("退会処理に失敗しました。時間をおいて再試行してください。");
        setSubmitting(false);
        return;
      }
      await supabase.auth.signOut();
      onDeleted();
    } catch {
      setError("退会処理に失敗しました。時間をおいて再試行してください。");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 bg-white w-full max-w-md rounded-2xl shadow-xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-950">退会の確認</h3>

        <div className="flex flex-col gap-3 text-sm text-gray-700 leading-relaxed">
          <p>以下のデータが完全に削除されます:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1 text-gray-600">
            <li>プロフィール・アイコン</li>
            <li>保存単語・保存フレーズ</li>
            <li>クイズ成績・学習ストリーク</li>
            <li>すべての学習履歴</li>
          </ul>
          {hasActiveSubscription && (
            <p className="text-sm text-gray-900 bg-primary-light rounded-lg p-3">
              現在ご加入のPremiumプランは、退会と同時に自動的に解約されます。
            </p>
          )}
          <p className="text-xs text-gray-500">
            残存する個人データは、プライバシーポリシーに基づき30日以内に完全に削除されます。
          </p>
          <p className="text-sm font-medium text-red-600">
            この操作は取り消せません。
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600">
            確認のため「<span className="font-bold text-gray-900">{CONFIRM_WORD}</span>」と入力してください
          </label>
          <TextInput
            value={confirmText}
            placeholder={CONFIRM_WORD}
            onChange={(e) => setConfirmText(e.target.value)}
            autoFocus
          />
        </div>

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
            size="md"
            onClick={handleDelete}
            disabled={!canSubmit}
            className="w-full md:w-auto bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "退会処理中..." : "退会する"}
          </Button>
        </div>
      </div>
    </div>
  );
}
