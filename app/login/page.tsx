'use client'

import { useForm } from "react-hook-form";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";
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
}

export default function AuthLogin() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>();

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
    <AuthPage>
      <AuthCard title="アカウントにログイン">
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
            {...register("password", { required: "パスワードは必須です" })}
          />
          <Button type="submit" disabled={isSubmitting} variant="primary" size="md" radius="lg" fullWidth>
            {isSubmitting ? "ログイン中..." : "ログイン"}
          </Button>
        </form>

        <AuthDivider />

        <GoogleAuthButton
          variant="login"
          onError={(message) => setError("email", { message })}
        />

        <AuthBottomLink prefix="アカウントをお持ちでない方は" linkText="新規登録" href="/signup" />
      </AuthCard>
    </AuthPage>
  );
}
