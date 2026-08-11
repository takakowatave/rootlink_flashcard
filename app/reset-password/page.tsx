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

interface FormData {
  password: string;
  confirmPassword: string;
}

type State = "checking" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [state, setState] = useState<State>("checking");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>();

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      setState(session ? "ready" : "invalid");
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setState("ready");
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async ({ password }: FormData) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError("password", { message: error.message });
      return;
    }
    setState("done");
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 1500);
  };

  return (
    <AuthPage>
      <AuthCard title="パスワードの再設定">
        {state === "checking" && (
          <p className="text-sm text-gray-500 text-center py-6">読み込み中...</p>
        )}

        {state === "invalid" && (
          <div className="flex flex-col gap-3 py-4 text-center">
            <p className="text-sm text-gray-900">
              リンクの有効期限が切れているか、無効なリンクです。
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              設定画面から再度パスワード再設定リクエストを送信してください。
            </p>
            <AuthBottomLink
              prefix="アカウントをお持ちの方は"
              linkText="ログイン"
              href="/login"
            />
          </div>
        )}

        {state === "ready" && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <TextInput
              label="新しいパスワード"
              type="password"
              placeholder="••••••••"
              helperText="8文字以上で設定してください"
              error={errors.password}
              {...register("password", {
                required: "パスワードは必須です",
                minLength: { value: 8, message: "8文字以上で設定してください" },
              })}
            />
            <TextInput
              label="パスワード (確認)"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword}
              {...register("confirmPassword", {
                required: "確認用パスワードを入力してください",
                validate: (v) => v === watch("password") || "パスワードが一致しません",
              })}
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              variant="primary"
              size="md"
              radius="lg"
              fullWidth
            >
              {isSubmitting ? "設定中..." : "パスワードを再設定"}
            </Button>
          </form>
        )}

        {state === "done" && (
          <div className="flex flex-col gap-3 py-4 text-center">
            <p className="text-sm text-primary font-medium">
              パスワードを再設定しました
            </p>
            <p className="text-xs text-gray-500">まもなくトップページへ移動します...</p>
          </div>
        )}
      </AuthCard>
    </AuthPage>
  );
}
