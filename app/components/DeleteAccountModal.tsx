"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { clearReminders } from "@/lib/reminders";
import { signOutRevenueCat } from "@/lib/revenuecat";
import Button from "./Button";
import { TextInput } from "./TextInput";
import { useDisplayLocale } from "@/lib/useDisplayLocale";

interface Props {
  open: boolean;
  onClose: () => void;
  hasActiveSubscription: boolean;
  onDeleted: () => void;
}

const CONFIRM_WORD_JA = "退会";
const CONFIRM_WORD_EN = "DELETE";

const API_BASE =
  process.env.NEXT_PUBLIC_CLOUDRUN_API_URL ??
  "https://rootlink-server-v2-774622345521.asia-northeast1.run.app";

export default function DeleteAccountModal({
  open,
  onClose,
  hasActiveSubscription,
  onDeleted,
}: Props) {
  const locale = useDisplayLocale();
  const CONFIRM_WORD = locale === 'en' ? CONFIRM_WORD_EN : CONFIRM_WORD_JA;
  const L = locale === 'en'
    ? {
        title: 'Delete account',
        introBefore: 'The following data will be permanently deleted:',
        itemProfile: 'Profile and avatar',
        itemWords: 'Saved words and phrases',
        itemStats: 'Learning progress and streaks',
        itemHistory: 'All learning history',
        premiumWarn: 'Your current Premium plan will be cancelled automatically when you delete your account.',
        privacyNote: 'Any remaining personal data will be permanently deleted within 30 days per our Privacy Policy.',
        irreversible: 'This action cannot be undone.',
        confirmPrompt: `Type "${CONFIRM_WORD}" to confirm`,
        cancel: 'Cancel',
        submitting: 'Deleting...',
        submit: 'Delete account',
        sessionError: 'Your session is invalid. Please log in again.',
        failed: 'Failed to delete account. Please try again later.',
      }
    : {
        title: '退会の確認',
        introBefore: '以下のデータが完全に削除されます:',
        itemProfile: 'プロフィール・アイコン',
        itemWords: '保存単語・保存フレーズ',
        itemStats: '学習成績・学習ストリーク',
        itemHistory: 'すべての学習履歴',
        premiumWarn: '現在ご加入のPremiumプランは、退会と同時に自動的に解約されます。',
        privacyNote: '残存する個人データは、プライバシーポリシーに基づき30日以内に完全に削除されます。',
        irreversible: 'この操作は取り消せません。',
        confirmPrompt: `確認のため「${CONFIRM_WORD}」と入力してください`,
        cancel: 'キャンセル',
        submitting: '退会処理中...',
        submit: '退会する',
        sessionError: 'セッションが無効です。再度ログインしてください。',
        failed: '退会処理に失敗しました。時間をおいて再試行してください。',
      };
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
        setError(L.sessionError);
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
        setError(L.failed);
        setSubmitting(false);
        return;
      }
      // 予約済みのローカル通知と保存済み設定は退会時に必ず片付ける。
      // 別アカウントで再ログインしたときに前ユーザーの reminder が発火するのを防ぐ。
      await clearReminders();
      // RevenueCat の紐付けもリセット。
      await signOutRevenueCat();
      await supabase.auth.signOut();
      onDeleted();
    } catch {
      setError(L.failed);
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
        <h3 className="text-lg font-semibold text-gray-950">{L.title}</h3>

        <div className="flex flex-col gap-3 text-sm text-gray-700 leading-relaxed">
          <p>{L.introBefore}</p>
          <ul className="list-disc pl-5 flex flex-col gap-1 text-gray-600">
            <li>{L.itemProfile}</li>
            <li>{L.itemWords}</li>
            <li>{L.itemStats}</li>
            <li>{L.itemHistory}</li>
          </ul>
          {hasActiveSubscription && (
            <p className="text-sm text-gray-900 bg-primary-light rounded-lg p-3">
              {L.premiumWarn}
            </p>
          )}
          <p className="text-xs text-gray-500">
            {L.privacyNote}
          </p>
          <p className="text-sm font-medium text-red-600">
            {L.irreversible}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600">
            {L.confirmPrompt}
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
            {L.cancel}
          </Button>
          <Button
            type="button"
            size="md"
            onClick={handleDelete}
            disabled={!canSubmit}
            className="w-full md:w-auto bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? L.submitting : L.submit}
          </Button>
        </div>
      </div>
    </div>
  );
}
