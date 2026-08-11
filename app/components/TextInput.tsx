"use client";

import { forwardRef, useState } from "react";
import { FieldError } from "react-hook-form";
import { BsEye, BsEyeSlash } from "react-icons/bs";

type Size = "sm" | "md";

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: FieldError;
  helperText?: string;
  size?: Size;
}

const sizeClass: Record<Size, string> = {
  sm: "h-10 text-sm",
  md: "h-12 text-base",
};

export const TextInput = forwardRef<HTMLInputElement, Props>(function TextInput(
  { label, error, helperText, type = "text", size = "md", className, disabled, ...props },
  ref,
) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;

  const base =
    "w-full rounded-lg border bg-white px-3 outline-none transition-colors placeholder:text-gray-400";
  const focus = error
    ? "focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
    : "focus:border-primary focus:ring-2 focus:ring-primary/20";
  const borderColor = error ? "border-red-500" : "border-line";
  const disabledStyle = disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "";

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm text-gray-600">{label}</label>}
      <div className="relative">
        <input
          {...props}
          ref={ref}
          type={inputType}
          disabled={disabled}
          aria-invalid={!!error}
          className={[
            base,
            sizeClass[size],
            borderColor,
            focus,
            disabledStyle,
            isPassword ? "pr-10" : "",
            className ?? "",
          ]
            .filter(Boolean)
            .join(" ")}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-gray-700"
            aria-label={show ? "パスワードを隠す" : "パスワードを表示"}
            tabIndex={-1}
          >
            {show ? <BsEyeSlash size={18} /> : <BsEye size={18} />}
          </button>
        )}
      </div>
      {error ? (
        <p className="text-xs text-red-500">{error.message}</p>
      ) : helperText ? (
        <p className="text-xs text-gray-500">{helperText}</p>
      ) : null}
    </div>
  );
});
