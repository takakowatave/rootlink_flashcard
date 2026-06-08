'use client'

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";
import { isInAppBrowser } from "../lib/isInAppBrowser";
import Button from "@/components/Button";

interface FormData {
  email: string;
  password: string;
  agreeToPrivacy: boolean;
}

export default function AuthSignup() {
  const [done, setDone] = useState(false);
  const [inAppBrowser, setInAppBrowser] = useState(false);

  useEffect(() => {
    setInAppBrowser(isInAppBrowser());
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>();

  const handleGoogleLogin = async () => {
    if (inAppBrowser) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/callback` },
    });
  };

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
    setDone(true);
  };

  return (
    <div className="relative flex min-h-[calc(100vh-40px)] items-center justify-center bg-gray-100 px-4 py-12">
      <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-center mb-3">
          <img src="/logo.svg" alt="RootLink" className="h-[17px] w-auto" />
        </div>
        <h2 className="text-lg font-semibold text-center mb-6">アカウント新規作成</h2>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-primary font-medium">確認メールを送信しました</p>
            <p className="text-sm text-gray-500">メールのリンクをクリックして登録を完了してください。</p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">メールアドレス</label>
                <input
                  type="email"
                  {...register("email", { required: "メールアドレスは必須です" })}
                  className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">パスワード</label>
                <input
                  type="password"
                  {...register("password", { required: "パスワードは必須です", minLength: { value: 8, message: "8文字以上で設定してください" } })}
                  className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                />
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="agreeToPrivacy"
                  className="mt-0.5 accent-primary"
                  {...register("agreeToPrivacy", { required: "プライバシーポリシーへの同意が必要です" })}
                />
                <label htmlFor="agreeToPrivacy" className="text-xs text-gray-600 leading-relaxed">
                  <Link href="/privacy" target="_blank" className="text-primary underline">プライバシーポリシー</Link>に同意する
                </label>
              </div>
              {errors.agreeToPrivacy && <p className="text-xs text-red-500 -mt-2">{errors.agreeToPrivacy.message}</p>}
              <Button type="submit" disabled={isSubmitting} variant="primary" size="md" radius="lg" fullWidth>
                {isSubmitting ? "登録中..." : "新規作成"}
              </Button>
            </form>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 border-t" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 border-t" />
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={inAppBrowser}
              className="w-full py-3 px-4 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <img src="/google-icon.svg" className="w-5 h-5" alt="Google" />
              Googleで登録
            </button>
            {inAppBrowser && (
              <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center leading-relaxed">
                アプリ内ブラウザでは Google ログインができません。<br />
                SafariまたはChromeでこのページを開いてください。
              </p>
            )}

            <p className="text-center text-xs text-gray-400 mt-4">
              すでにアカウントをお持ちの方は{" "}
              <Link href="/login" className="text-primary underline">ログイン</Link>
            </p>
          </>
        )}
      </div>

      <footer className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-1 text-xs text-gray-400">
        <div className="flex gap-6">
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">プライバシーポリシー</Link>
          <a href="https://tally.so/r/ODJoEY" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors">お問い合わせ</a>
        </div>
        <p>© 2026 RootLink. All rights reserved.</p>
      </footer>
    </div>
  );
}
