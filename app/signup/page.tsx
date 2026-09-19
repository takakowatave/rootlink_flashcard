'use client'

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";
import { HiOutlineEnvelope } from "react-icons/hi2";
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
  const [done, setDone] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [inAppBrowser, setInAppBrowser] = useState(false);
  const [existingAccount, setExistingAccount] = useState(false);
  // native は /onboarding のスプラッシュで規約・プライバシーへの同意動線を
  // 通しているので、signup の checkbox は重複。ここでは Web だけ出す。
  // hydration mismatch を避けるため mount 後に判定する。
  const [isNative, setIsNative] = useState(false);
  useEffect(() => setInAppBrowser(isInAppBrowser()), []);
  useEffect(() => setIsNative(isNativePlatform()), []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setExistingAccount(false);
    // native はメール本文のリンクを Chrome が開くため、Supabase の 303 で
    // カスタムスキームを起こせない。一旦 https の中継ページに戻し、そこで
    // ユーザー操作の遷移として com.rootlink.app://auth-callback を叩かせる。
    const emailRedirectTo = isNativePlatform()
      ? "https://www.rootlink.app/auth/app-return"
      : `${window.location.origin}/callback`;
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { emailRedirectTo },
    });
    if (error) {
      setError("email", { message: error.message });
      return;
    }
    // Supabase は確認済みの既存メールで signUp すると error を返さず
    // user.identities を空配列にする（なりすまし対策）。
    // 未確認で残っているだけのメールは identities が付いてくるので、
    // その場合は今まで通り確認メール送信の完了画面へ進める。
    if (signUpData.user && signUpData.user.identities?.length === 0) {
      setExistingAccount(true);
      setError("email", {
        message: "このメールアドレスはすでに登録されています",
      });
      return;
    }
    setSentEmail(data.email);
    setDone(true);
  };

  return (
    <AuthPage>
      <AuthCard title={done ? "メールアドレスをご確認ください" : "アカウント新規作成"}>
        {done ? (
          <div className="flex flex-col items-center gap-5 py-4 text-center">
            <HiOutlineEnvelope className="text-primary" size={72} strokeWidth={1.2} />
            <p className="text-gray-900 font-medium break-all leading-relaxed">
              <span className="text-primary font-semibold">{sentEmail}</span>
              <br />
              宛に確認メールを送信しました
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              メール内のリンクをクリックして<br />
              登録を完了してください。
            </p>
            <p className="text-xs text-gray-500 leading-relaxed mt-1">
              数分待っても届かない場合、迷惑メールフォルダをご確認ください。
              <br />
              既にご登録済みの場合は{" "}
              <Link href="/login" className="text-primary underline">ログイン</Link>
              {" "}をお試しください。
            </p>
          </div>
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
            className="p-2 -mr-1 rounded-full hover:bg-gray-100 text-muted"
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
