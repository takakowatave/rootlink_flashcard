'use client'

import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";
import { BsCheck2 } from "react-icons/bs";
import Button from "@/components/Button";
import { TextInput } from "@/components/TextInput";
import AuthPage from "@/components/auth/AuthPage";
import AuthCard from "@/components/auth/AuthCard";
import AuthDivider from "@/components/auth/AuthDivider";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import AuthBottomLink from "@/components/auth/AuthBottomLink";

interface FormData {
  email: string;
  password: string;
  agreeToPrivacy: boolean;
}

export default function AuthSignup() {
  const [done, setDone] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { emailRedirectTo: `${window.location.origin}/callback` },
    });
    if (error) {
      setError("email", { message: error.message });
      return;
    }
    setSentEmail(data.email);
    setDone(true);
  };

  return (
    <AuthPage>
      <AuthCard title="アカウント新規作成">
        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-gray-900 font-medium break-all">
              <span className="text-primary font-semibold">{sentEmail}</span>
              <br />
              宛に確認メールを送信しました
            </p>
            <p className="text-sm text-gray-500">メールのリンクをクリックして登録を完了してください。</p>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              数分待っても届かない場合、このメールアドレスは既に登録されている可能性があります。
              <br />
              <Link href="/login" className="text-primary underline">ログイン</Link>をお試しください。
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <TextInput
                type="email"
                label="メールアドレス"
                error={errors.email}
                {...register("email", { required: "メールアドレスは必須です" })}
              />
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
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  {...register("agreeToPrivacy", { required: "プライバシーポリシーへの同意が必要です" })}
                />
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-line bg-white flex items-center justify-center text-transparent transition-colors peer-checked:bg-primary peer-checked:border-primary peer-checked:text-primary-dark">
                  <BsCheck2 size={14} className="text-current" />
                </span>
                <span className="text-xs text-gray-600 leading-relaxed">
                  <Link href="/privacy" target="_blank" className="text-primary underline">プライバシーポリシー</Link>に同意する
                </span>
              </label>
              {errors.agreeToPrivacy && <p className="text-xs text-red-500 -mt-2">{errors.agreeToPrivacy.message}</p>}
              <Button type="submit" disabled={isSubmitting} variant="primary" size="md" radius="lg" fullWidth>
                {isSubmitting ? "登録中..." : "新規作成"}
              </Button>
            </form>

            <AuthDivider />

            <GoogleAuthButton
              variant="signup"
              onError={(message) => setError("email", { message })}
            />

            <AuthBottomLink prefix="すでにアカウントをお持ちの方は" linkText="ログイン" href="/login" />
          </>
        )}
      </AuthCard>
    </AuthPage>
  );
}
