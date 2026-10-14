"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabaseClient";
import { TextInput } from "./TextInput";
import Button from "./Button";
import OtpVerifyStep from "./auth/OtpVerifyStep";

interface FormData {
  email: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  currentEmail: string;
  onSent: (newEmail: string) => void;
}

type Step = "input" | "otp";

/**
 * メールアドレス変更モーダル。
 *
 * 旧: updateUser({ email }) で新しいメールアドレスにリンクを送信 →
 *     ユーザーがリンクをタップ → 変更完了。
 * 新: updateUser({ email }) でコード送信 → 同じモーダル内で OTP 入力 →
 *     verifyOtp({ email: 新しいメール, type: 'email_change' }) → 変更完了。
 */
export default function EmailChangeModal({ open, onClose, currentEmail, onSent }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>();
  const [step, setStep] = useState<Step>("input");
  const [pendingEmail, setPendingEmail] = useState("");
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
      reset();
      setStep("input");
      setPendingEmail("");
      setOtpError(null);
      setOtpSubmitting(false);
    };
  }, [open, onClose, reset]);

  if (!open) return null;

  const onSubmit = async ({ email }: FormData) => {
    if (email === currentEmail) {
      setError("email", { message: "現在のメールアドレスと同じです" });
      return;
    }
    const { error } = await supabase.auth.updateUser({ email });
    if (error) {
      setError("email", { message: error.message });
      return;
    }
    setPendingEmail(email);
    setStep("otp");
  };

  const handleVerify = async (code: string) => {
    setOtpSubmitting(true);
    setOtpError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: pendingEmail,
      token: code,
      type: "email_change",
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
    onSent(pendingEmail);
    reset();
    setStep("input");
    setPendingEmail("");
  };

  const handleResend = async () => {
    const { error } = await supabase.auth.resend({
      type: "email_change",
      email: pendingEmail,
    });
    if (error) {
      setOtpError("再送に失敗しました。時間をおいて再試行してください");
    }
  };

  const handleEditEmail = () => {
    setStep("input");
    setPendingEmail("");
    setOtpError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {step === "input" ? (
          <>
            <h3 className="text-base font-semibold text-gray-950">
              メールアドレスの変更
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              現在:{" "}
              <span className="font-medium text-gray-900 break-all">{currentEmail}</span>
              <br />
              新しいメールアドレスに確認コードを送信します。
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <TextInput
                label="新しいメールアドレス"
                type="email"
                placeholder="new@example.com"
                autoFocus
                error={errors.email}
                {...register("email", {
                  required: "メールアドレスは必須です",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "メールアドレスの形式が正しくありません",
                  },
                })}
              />
              <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
                <Button
                  type="button"
                  variant="tertiary"
                  size="md"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-full md:w-auto"
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                  className="w-full md:w-auto"
                >
                  {isSubmitting ? "送信中..." : "確認コードを送信"}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <OtpVerifyStep
            email={pendingEmail}
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
