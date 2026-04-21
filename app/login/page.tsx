'use client'

import { useForm } from "react-hook-form";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FormData {
  email: string;
  password: string;
}

export default function AuthLogin() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>();

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/callback` },
    });
  };

  const onSubmit = async (data: FormData) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      setError("email", { message: "メールアドレスまたはパスワードが正しくありません" });
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <div className="relative flex min-h-[calc(100vh-40px)] items-center justify-center bg-gray-100 px-4 py-12">
      <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-center mb-3">
          <img src="/logo.svg" alt="RootLink" className="h-[17px] w-auto" />
        </div>
        <h2 className="text-lg font-semibold text-center mb-6">アカウントにログイン</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">メールアドレス</label>
            <input
              type="email"
              {...register("email", { required: "メールアドレスは必須です" })}
              className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">パスワード</label>
            <input
              type="password"
              {...register("password", { required: "パスワードは必須です" })}
              className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg bg-[#009689] text-white text-sm font-medium disabled:opacity-50"
          >
            {isSubmitting ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 border-t" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 border-t" />
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-3 px-4 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 text-sm"
        >
          <img src="/google-icon.svg" className="w-5 h-5" alt="Google" />
          Googleでログイン
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          アカウントをお持ちでない方は{" "}
          <Link href="/signup" className="text-[#009689] underline">新規登録</Link>
        </p>
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
