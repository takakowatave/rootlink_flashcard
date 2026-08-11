"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabaseClient";
import { TextInput } from "./TextInput";
import Button from "./Button";

interface FormData {
  email: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  currentEmail: string;
  onSent: (newEmail: string) => void;
}

export default function EmailChangeModal({ open, onClose, currentEmail, onSent }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>();
  const [redirect, setRedirect] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRedirect(`${window.location.origin}/callback`);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      reset();
    };
  }, [open, onClose, reset]);

  if (!open) return null;

  const onSubmit = async ({ email }: FormData) => {
    if (email === currentEmail) {
      setError("email", { message: "現在のメールアドレスと同じです" });
      return;
    }
    const { error } = await supabase.auth.updateUser(
      { email },
      { emailRedirectTo: redirect || undefined },
    );
    if (error) {
      setError("email", { message: error.message });
      return;
    }
    onSent(email);
    reset();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-gray-950">メールアドレスの変更</h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          現在: <span className="font-medium text-gray-900 break-all">{currentEmail}</span>
          <br />
          新しいメールアドレスに確認リンクを送信します。リンクをクリックするまで変更は完了しません。
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <TextInput
            label="新しいメールアドレス"
            type="email"
            placeholder="new@example.com"
            autoFocus
            error={errors.email}
            {...register("email", {
              required: "メールアドレスは必須です",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "メールアドレスの形式が正しくありません",
              },
            })}
          />
          <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
            <Button
              type="button"
              variant="tertiary"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full md:w-auto"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              className="w-full md:w-auto"
            >
              {isSubmitting ? "送信中..." : "確認メールを送信"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
