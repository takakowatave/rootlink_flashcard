'use client'

import { useForm } from "react-hook-form";
import { apiRequest } from "../lib/apiClient";
import { TextInput } from "../components/TextInput";
import Button from "../components/button";
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

    // -----------------------------
    // Googleログイン
    // -----------------------------
    const handleGoogleLogin = async () => {
        await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
        },
        });
    };

    // -----------------------------
    // メール & パスワードログイン
    // -----------------------------
    const onSubmit = async (data: FormData) => {
        try {
        const res = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify(data),
        });

        if ("session" in res) {
            localStorage.setItem("access_token", res.session.access_token);
            router.push("/");
        } else if ("error" in res) {
            setError("email", { message: res.error });
        } else {
            setError("email", { message: "不明なレスポンスです。" });
        }
        } catch (err) {
        setError("email", {
            message:
            err instanceof Error ? err.message : "ログインに失敗しました。",
        });
        }
    };

    return (
        <div className="flex justify-center bg-gray-100 px-4 py-12">
        <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-md">
            <h1 className="text-3xl font-bold text-center text-green-700 mb-2">
            RootLink
            </h1>
            <h2 className="text-lg font-semibold text-center mb-6">
            アカウントにログイン
            </h2>

            {/* <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <TextInput
                label="メールアドレス"
                type="email"
                error={errors.email}
                {...register("email", { required: "メールアドレスは必須です" })}
            />

            <TextInput
                label="パスワード"
                type="password"
                error={errors.password}
                {...register("password", { required: "パスワードは必須です" })}
            />

            <Button
                type="submit"
                text={isSubmitting ? "ログイン中..." : "ログイン"}
                disabled={isSubmitting}
                variant="primary"
            />
            </form> */}

            {/* 仕切り線 */}
            {/* <div className="flex items-center my-6">
            <div className="flex-grow border-t" />
            <span className="text-xs text-gray-400 mx-3">or</span>
            <div className="flex-grow border-t" />
            </div> */}

            {/* Googleログイン */}
            <button
            onClick={handleGoogleLogin}
            className="w-full py-2 px-4 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2"
            >
            <img src="/google-icon.svg" className="w-5 h-5" alt="Google" />
            Googleでログイン
            </button>

            {/* パスワード忘れ
            <div className="text-center mt-4">
            <Link
                href="/password/request"
                className="text-blue-600 text-sm hover:underline"
            >
                パスワードを忘れた方
            </Link>
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
            ©Rootlink2025. All rights reserved.
            </p> */}
        </div>
        </div>
    );
}
