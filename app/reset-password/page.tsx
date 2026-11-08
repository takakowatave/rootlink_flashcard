"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import Button from "@/components/Button";
import { TextInput } from "@/components/TextInput";
import AuthPage from "@/components/auth/AuthPage";
import AuthCard from "@/components/auth/AuthCard";
import AuthBottomLink from "@/components/auth/AuthBottomLink";
import OtpVerifyStep from "@/components/auth/OtpVerifyStep";
import { useDisplayLocale } from "@/lib/useDisplayLocale";
import { messages } from "@/lib/i18n/messages";

interface FormData {
  password: string;
  confirmPassword: string;
}

interface EmailFormData {
  email: string;
}

type Step =
  | "checking"
  | "email" // メール入力 (未ログイン時のエントリ)
  | "otp" // コード入力
  | "ready" // 新パスワード入力
  | "done";

/**
 * パスワード再設定ページ。
 *
 * 旧: メールのリンクを踏むと recovery セッションが張られ、このページが
 *     'ready' で描画される。
 * 新: ログアウト時はこのページで email → OTP → 新パスワードまで完結する。
 *     ログイン済みから PasswordResetConfirmModal 経由で verifyOtp 済みで
 *     来たときは getSession() で session が見えるので 'ready' に直行する。
 *     どちらにしても最後の updateUser({ password }) は共通。
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const locale = useDisplayLocale();
  const authCopy = messages[locale].auth;
  const t = locale === 'en'
    ? {
        title: 'Reset password',
        loading: 'Loading...',
        sendIntro: 'Enter the email you registered with. We will send a verification code.',
        sending: 'Sending...',
        sendCode: 'Send code',
        haveAccount: 'Already have an account? ',
        loginLink: 'Log in',
        sendFailed: 'Failed to send. Please try again later.',
        resendFailed: 'Resend failed. Please try again later.',
        newPassword: 'New password',
        confirmPassword: 'Confirm password',
        confirmPasswordRequired: 'Please confirm your password',
        passwordMismatch: 'Passwords do not match',
        settingPassword: 'Setting...',
        resetSubmit: 'Reset password',
        doneTitle: 'Password reset complete',
        doneSub: 'Redirecting to the home page...',
      }
    : {
        title: 'パスワードの再設定',
        loading: '読み込み中...',
        sendIntro: '登録されているメールアドレスに確認コードを送ります。',
        sending: '送信中...',
        sendCode: 'コードを送る',
        haveAccount: 'アカウントをお持ちの方は',
        loginLink: 'ログイン',
        sendFailed: '送信に失敗しました。時間をおいて再試行してください',
        resendFailed: '再送に失敗しました。時間をおいて再試行してください',
        newPassword: '新しいパスワード',
        confirmPassword: 'パスワード (確認)',
        confirmPasswordRequired: '確認用パスワードを入力してください',
        passwordMismatch: 'パスワードが一致しません',
        settingPassword: '設定中...',
        resetSubmit: 'パスワードを再設定',
        doneTitle: 'パスワードを再設定しました',
        doneSub: 'まもなくトップページへ移動します...',
      };
  const [step, setStep] = useState<Step>("checking");
  const [email, setEmail] = useState("");
  const [sendError, setSendError] = useState<string | undefined>();
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSubmitting, setOtpSubmitting] = useState(false);

  const emailForm = useForm<EmailFormData>();
  const passwordForm = useForm<FormData>();

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      setStep(session ? "ready" : "email");
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStep("ready");
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const onSendEmail = async ({ email: inputEmail }: EmailFormData) => {
    setSendError(undefined);
    const { error } = await supabase.auth.resetPasswordForEmail(inputEmail);
    if (error) {
      setSendError(t.sendFailed);
      return;
    }
    setEmail(inputEmail);
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
          ? authCopy.otpInvalid
          : error.message,
      );
      return;
    }
    setStep("ready");
  };

  const handleResend = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setOtpError(t.resendFailed);
    }
  };

  const handleEditEmail = () => {
    setEmail("");
    setOtpError(null);
    setStep("email");
  };

  const onSubmitPassword = async ({ password }: FormData) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      passwordForm.setError("password", { message: error.message });
      return;
    }
    setStep("done");
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 1500);
  };

  return (
    <AuthPage>
      <AuthCard title={t.title}>
        {step === "checking" && (
          <p className="text-sm text-gray-500 text-center py-6">{t.loading}</p>
        )}

        {step === "email" && (
          <form
            onSubmit={emailForm.handleSubmit(onSendEmail)}
            className="flex flex-col gap-4"
          >
            <p className="text-sm text-gray-700 leading-relaxed">
              {t.sendIntro}
            </p>
            <TextInput
              label={authCopy.email}
              type="email"
              placeholder="email@example.com"
              autoFocus
              error={emailForm.formState.errors.email}
              {...emailForm.register("email", {
                required: authCopy.emailRequired,
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: locale === 'en' ? 'Please enter a valid email' : 'メールアドレスの形式が正しくありません',
                },
              })}
            />
            {sendError && <p className="text-xs text-red-500">{sendError}</p>}
            <Button
              type="submit"
              disabled={emailForm.formState.isSubmitting}
              variant="primary"
              size="md"
              radius="lg"
              fullWidth
            >
              {emailForm.formState.isSubmitting ? t.sending : t.sendCode}
            </Button>
            <AuthBottomLink
              prefix={t.haveAccount}
              linkText={t.loginLink}
              href="/login"
            />
          </form>
        )}

        {step === "otp" && (
          <OtpVerifyStep
            email={email}
            onVerify={handleVerify}
            onResend={handleResend}
            onEditEmail={handleEditEmail}
            submitting={otpSubmitting}
            error={otpError}
          />
        )}

        {step === "ready" && (
          <form
            onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
            className="flex flex-col gap-4"
          >
            <TextInput
              label={t.newPassword}
              type="password"
              placeholder="••••••••"
              helperText={authCopy.passwordHelper}
              error={passwordForm.formState.errors.password}
              {...passwordForm.register("password", {
                required: authCopy.passwordRequired,
                minLength: { value: 8, message: authCopy.passwordMinLength },
              })}
            />
            <TextInput
              label={t.confirmPassword}
              type="password"
              placeholder="••••••••"
              error={passwordForm.formState.errors.confirmPassword}
              {...passwordForm.register("confirmPassword", {
                required: t.confirmPasswordRequired,
                validate: (v) =>
                  v === passwordForm.watch("password") || t.passwordMismatch,
              })}
            />
            <Button
              type="submit"
              disabled={passwordForm.formState.isSubmitting}
              variant="primary"
              size="md"
              radius="lg"
              fullWidth
            >
              {passwordForm.formState.isSubmitting ? t.settingPassword : t.resetSubmit}
            </Button>
          </form>
        )}

        {step === "done" && (
          <div className="flex flex-col gap-3 py-4 text-center">
            <p className="text-sm text-primary font-medium">
              {t.doneTitle}
            </p>
            <p className="text-xs text-gray-500">{t.doneSub}</p>
          </div>
        )}
      </AuthCard>
    </AuthPage>
  );
}
