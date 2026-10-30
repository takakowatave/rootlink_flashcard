'use client'

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";
import { HiX } from "react-icons/hi";
import Button from "@/components/Button";
import { TextInput } from "@/components/TextInput";
import TermsAgreementCheckbox from "@/components/TermsAgreementCheckbox";
import AuthPage from "@/components/auth/AuthPage";
import AuthCard from "@/components/auth/AuthCard";
import AuthDivider from "@/components/auth/AuthDivider";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import AppleAuthButton from "@/components/auth/AppleAuthButton";
import AuthBottomLink from "@/components/auth/AuthBottomLink";
import InAppBrowserNotice from "@/components/auth/InAppBrowserNotice";
import TurnstileWidget from "@/components/auth/TurnstileWidget";
import NativeAuthForm from "@/components/auth/NativeAuthForm";
import OtpVerifyStep from "@/components/auth/OtpVerifyStep";
import ModalShell from "@/components/ModalShell";
import PrivacyContent from "@/components/PrivacyContent";
import { isInAppBrowser } from "@/lib/isInAppBrowser";
import { isNativePlatform } from "@/lib/isNativePlatform";

interface FormData {
  email: string;
  password: string;
  agreeToPrivacy: boolean;
}

export default function AuthSignup() {
  const router = useRouter();
  const [sentEmail, setSentEmail] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [inAppBrowser, setInAppBrowser] = useState(false);
  const [existingAccount, setExistingAccount] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const handleCaptcha = useCallback((token: string) => setCaptchaToken(token), []);
  const [isNative, setIsNative] = useState(false);
  const [platformResolved, setPlatformResolved] = useState(false);
  useEffect(() => setInAppBrowser(isInAppBrowser()), []);
  useEffect(() => {
    setIsNative(isNativePlatform());
    setPlatformResolved(true);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setExistingAccount(false);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        // 未配布時は空文字。Supabase Dashboard 側で captcha protection が有効
        // なら 400 で弾かれる (段階導入前提)。無効なら captchaToken は無視される。
        captchaToken: captchaToken || undefined,
      },
    });
    if (error) {
      setError("email", { message: error.message });
      return;
    }
    // Supabase は確認済みの既存メールで signUp すると error を返さず
    // user.identities を空配列にする（なりすまし対策）。
    if (signUpData.user && signUpData.user.identities?.length === 0) {
      setExistingAccount(true);
      setError("email", {
        message: "このメールアドレスはすでに登録されています",
      });
      return;
    }
    setSentEmail(data.email);
  };

  const handleVerify = async (code: string) => {
    setOtpSubmitting(true);
    setOtpError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: sentEmail,
      token: code,
      type: "email",
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
    router.push("/callback");
    router.refresh();
  };

  const handleResend = async () => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: sentEmail,
    });
    if (error) {
      setOtpError("再送に失敗しました。時間をおいて再試行してください");
    }
  };

  const handleEditEmail = () => {
    setSentEmail("");
    setOtpError(null);
  };

  // platform 判定が終わるまでは何も描画しない。
  if (!platformResolved) return null;
  if (isNative) return <NativeAuthForm mode="signup" />;

  const inOtpStep = sentEmail.length > 0;

  return (
    <AuthPage>
      <AuthCard title={inOtpStep ? "確認コードを入力" : "アカウント新規作成"}>
        {inOtpStep ? (
          <OtpVerifyStep
            email={sentEmail}
            onVerify={handleVerify}
            onResend={handleResend}
            onEditEmail={handleEditEmail}
            submitting={otpSubmitting}
            error={otpError}
          />
        ) : (
          <>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <TextInput
                type="email"
                label="メールアドレス"
                error={errors.email}
                {...register("email", { required: "メールアドレスは必須です" })}
              />
              {existingAccount && (
                <p className="-mt-3 text-sm">
                  <Link href="/login" className="text-primary underline">
                    ログインはこちら
                  </Link>
                </p>
              )}
              <TextInput
                type="password"
                label="パスワード"
                error={errors.password}
                helperText="8文字以上で設定してください"
                {...register("password", {
                  required: "パスワードは必須です",
                  minLength: { value: 8, message: "8文字以上で設定してください" },
                })}
              />
              {!isNative && (
                <TermsAgreementCheckbox
                  error={errors.agreeToPrivacy}
                  {...register("agreeToPrivacy", { required: "プライバシーポリシーへの同意が必要です" })}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setPrivacyOpen(true);
                    }}
                    className="text-primary underline"
                  >
                    プライバシーポリシー
                  </button>
                  に同意する
                </TermsAgreementCheckbox>
              )}
              <TurnstileWidget onVerify={handleCaptcha} />
              <Button type="submit" disabled={isSubmitting} variant="primary" size="md" radius="lg" fullWidth>
                {isSubmitting ? "登録中..." : "新規作成"}
              </Button>
            </form>

            <AuthDivider />

            {inAppBrowser && <InAppBrowserNotice variant="signup" />}
            <div className="flex flex-col gap-2">
              <GoogleAuthButton
                variant="signup"
                onError={(message) => setError("email", { message })}
              />
              <AppleAuthButton
                variant="signup"
                onError={(message) => setError("email", { message })}
              />
            </div>

            <AuthBottomLink prefix="すでにアカウントをお持ちの方は" linkText="ログイン" href="/login" />
          </>
        )}
      </AuthCard>

      <ModalShell
        open={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        headerRight={
          <button
            type="button"
            onClick={() => setPrivacyOpen(false)}
            className="p-2 -mr-1 rounded-full hover:bg-primary-light text-muted"
            aria-label="閉じる"
          >
            <HiX className="size-5" />
          </button>
        }
      >
        <div className="px-6 py-8">
          <PrivacyContent />
        </div>
      </ModalShell>
    </AuthPage>
  );
}
