"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Button from "./Button";
import OtpVerifyStep from "./auth/OtpVerifyStep";

interface Props {
  open: boolean;
  onClose: () => void;
  email: string;
  onSent: () => void;
}

type Step = "confirm" | "otp";

/**
 * 設定画面から「パスワード再設定」を開いたときのモーダル。
 *
 * 旧: メールリンク方式 → EmailSentDialog を表示 → ユーザーがメール内のリンクをタップ。
 * 新: resetPasswordForEmail でコード送信 → 同じモーダル内で OTP 入力 → verifyOtp({ type: 'recovery' })
 *     → PASSWORD_RECOVERY セッションを張り、/reset-password で新パスワードを入力させる。
 */
export default function PasswordResetConfirmModal({ open, onClose, email, onSent }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("confirm");
  const [submitting, setSubmitting] = useState(false);
  const [sendError, setSendError] = useState<string | undefined>();
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSubmitting, setOtpSubmitting] = useState(false);

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
      // モーダルを閉じたら state をリセット (次回開いたとき confirm から始める)
      setStep("confirm");
      setSendError(undefined);
      setOtpError(null);
      setSubmitting(false);
      setOtpSubmitting(false);
    };
  }, [open, onClose]);

  if (!open) return null;

  const sendCode = async () => {
    if (!email) return;
    setSubmitting(true);
    setSendError(undefined);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setSubmitting(false);
    if (error) {
      setSendError("送信に失敗しました。時間をおいて再試行してください。");
      return;
    }
    setStep("otp");
  };

  const handleVerify = async (code: string) => {
    setOtpSubmitting(true);
    setOtpError(null);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "recovery",
    });
    setOtpSubmitting(false);
    if (error) {
      setOtpError(
        /expired|invalid/i.test(error.message)
          ? "コードが違うか期限切れです。もう一度ご確認ください"
          : error.message,
      );
      return;
    }
    onSent();
    onClose();
    router.push("/reset-password");
  };

  const handleResend = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setOtpError("再送に失敗しました。時間をおいて再試行してください");
    }
  };

  const handleEditEmail = () => {
    setStep("confirm");
    setOtpError(null);
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
        {step === "confirm" ? (
          <>
            <h3 className="text-base font-semibold text-gray-950">パスワードの再設定</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              こちらのアドレスに確認コードを送信します。
            </p>
            <p className="text-base font-medium text-primary break-all">{email}</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              次の画面でコードを入力して、新しいパスワードを設定してください。
            </p>
            {sendError && <p className="text-xs text-red-500">{sendError}</p>}
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
                onClick={sendCode}
                disabled={submitting}
                className="w-full md:w-auto"
              >
                {submitting ? "送信中..." : "送信"}
              </Button>
            </div>
          </>
        ) : (
          <OtpVerifyStep
            email={email}
            onVerify={handleVerify}
            onResend={handleResend}
            onEditEmail={handleEditEmail}
            submitting={otpSubmitting}
            error={otpError}
          />
        )}
      </div>
    </div>
  );
}
