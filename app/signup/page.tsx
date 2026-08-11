'use client'

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";
import { BsCheck2 } from "react-icons/bs";
import { isInAppBrowser } from "../lib/isInAppBrowser";
import Button from "@/components/Button";
import { TextInput } from "@/components/TextInput";

interface FormData {
  email: string;
  password: string;
  agreeToPrivacy: boolean;
}

export default function AuthSignup() {
  const [done, setDone] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [inAppBrowser, setInAppBrowser] = useState(false);
  const [copyLabel, setCopyLabel] = useState("URLをコピー");

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
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/callback`,
          skipBrowserRedirect: true,
        },
      });
      if (error) {
        setError("email", { message: "Googleログインに失敗しました。時間をおいて再試行してください" });
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("email", { message: "Googleログインに失敗しました。時間をおいて再試行してください" });
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyLabel("コピーしました");
      setTimeout(() => setCopyLabel("URLをコピー"), 2000);
    } catch {
      setCopyLabel("コピー失敗");
      setTimeout(() => setCopyLabel("URLをコピー"), 2000);
    }
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
    setSentEmail(data.email);
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
            <p className="text-primary font-medium break-all">
              <span className="font-semibold">{sentEmail}</span> 宛に確認メールを送信しました
            </p>
            <p className="text-sm text-gray-500">メールのリンクをクリックして登録を完了してください。</p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mb-6">
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

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 border-t" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 border-t" />
            </div>

            {inAppBrowser && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-md text-xs text-gray-700 leading-relaxed">
                <p className="font-semibold mb-1">Google登録をご利用の方へ</p>
                <p className="mb-2">
                  このアプリ内ブラウザでは Google の仕様により登録できません。<br />
                  Safari や Chrome で開き直してください。
                </p>
                <button
                  onClick={handleCopyUrl}
                  className="text-primary underline text-xs"
                >
                  {copyLabel}
                </button>
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={inAppBrowser}
              className="w-full py-3 px-4 bg-white border border-line rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <img src="/google-icon.svg" className="w-5 h-5" alt="Google" />
              Googleで登録
            </button>

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
