"use client";

import { useEffect } from "react";
import { MdMarkEmailRead } from "react-icons/md";
import Button from "./Button";

export type EmailSentVariant =
  | "signup-confirm"
  | "email-change"
  | "password-reset";

const HEADING: Record<EmailSentVariant, string> = {
  "signup-confirm": "確認メールを送信しました",
  "email-change": "確認メールを送信しました",
  "password-reset": "再設定メールを送信しました",
};

const INSTRUCTION: Record<EmailSentVariant, string> = {
  "signup-confirm":
    "メール内のリンクをクリックして登録を完了してください。",
  "email-change":
    "新しいメールアドレスに送信された確認リンクをクリックして変更を完了してください。",
  "password-reset":
    "メール内のリンクから新しいパスワードを設定してください。",
};

const FALLBACK: Record<EmailSentVariant, string> = {
  "signup-confirm":
    "数分待っても届かない場合、このメールアドレスは既に登録されている可能性があります。",
  "email-change":
    "数分待っても届かない場合は、迷惑メールフォルダをご確認ください。",
  "password-reset":
    "数分待っても届かない場合は、迷惑メールフォルダをご確認ください。",
};

interface Props {
  open: boolean;
  onClose: () => void;
  sentTo: string;
  variant: EmailSentVariant;
}

export default function EmailSentDialog({ open, onClose, sentTo, variant }: Props) {
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
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 flex flex-col items-center text-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-full bg-primary-subtle flex items-center justify-center text-primary-hover">
          <MdMarkEmailRead size={28} />
        </div>
        <h3 className="text-base font-semibold text-gray-950">{HEADING[variant]}</h3>
        <p className="text-sm text-gray-900 break-all">
          <span className="text-primary font-semibold">{sentTo}</span>
          <br />
          <span className="text-gray-700">宛にメールを送信しました</span>
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">{INSTRUCTION[variant]}</p>
        <p className="text-xs text-gray-500 leading-relaxed mt-1">{FALLBACK[variant]}</p>
        <Button
          type="button"
          variant="primary"
          size="md"
          radius="lg"
          fullWidth
          onClick={onClose}
          className="mt-3"
        >
          OK
        </Button>
      </div>
    </div>
  );
}
