'use client'

import { useForm } from "react-hook-form";
import { apiRequest } from "../lib/apiClient";
import { TextInput } from "../components/TextInput";
import Button from "../components/button";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface FormData {
    email: string;
    password: string;
    }

    export default function AuthSignup() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<FormData>();

    const [successEmail, setSuccessEmail] = useState<string | null>(null);

    // -----------------------------
    // Google OAuth Sign-up / Login
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
    // Email + Password Sign-up
    // -----------------------------
    const onSubmit = async (data: FormData) => {
        try {
        const res = await apiRequest("/auth/signup", {
            method: "POST",
            body: JSON.stringify(data),
        });

        if ("error" in res) {
            setError("email", { message: res.error });
            return;
        }

        setSuccessEmail(data.email);

        } catch (err) {
        setError("email", {
            message:
            err instanceof Error ? err.message : "サインアップに失敗しました。",
        });
        }
    };

    return (
        <div className="flex justify-center bg-gray-100 px-4 pt-16">
        <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-md">
            <h1 className="text-3xl font-bold text-center text-green-700 mb-2">
            RootLink
            </h1>
            <h2 className="text-lg font-semibold text-center mb-6">
            アカウント新規作成
            </h2>

            {successEmail && (
            <div className="flex items-center gap-2 bg-green-100 border border-green-300 text-green-700 p-3 rounded mb-4">
                <span>✔️</span>
                <span>確認メールを送信しました</span>
            </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <TextInput
                label="メールアドレス"
                type="email"
                error={errors.email}
                {...register("email", { required: "メールアドレスは必須です" })}
            />

            <div>
                <TextInput
                label="パスワード"
                type="password"
                error={errors.password}
                {...register("password", { required: "パスワードは必須です" })}
                />
                <p className="text-xs text-gray-500 mt-1">
                半角アルファベット、大文字、数字、記号を組み合わせて8文字以上で設定してください。
                </p>
            </div>

            <Button
                type="submit"
                text={isSubmitting ? "登録中..." : "新規作成"}
                disabled={isSubmitting || Boolean(successEmail)}
                variant="primary"
            />
            </form>

            {/* 仕切り線 */}
            <div className="flex items-center my-6">
            <div className="flex-grow border-t" />
            <span className="text-xs text-gray-400 mx-3">or</span>
            <div className="flex-grow border-t" />
            </div>

            {/* Googleログイン */}
            <button
            onClick={handleGoogleLogin}
            className="w-full py-2 px-4 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2"
            >
            <img src="/google-icon.svg" className="w-5 h-5" alt="Google" />
            Googleでログイン / 新規作成
            </button>

            <p className="text-center text-xs text-gray-400 mt-6">
            ©Rootlink2025. All rights reserved.
            </p>
        </div>
        </div>
    );
}
