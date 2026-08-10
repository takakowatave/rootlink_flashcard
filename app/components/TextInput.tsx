"use client";

import { forwardRef, useState } from "react";
import { FieldError } from "react-hook-form";
import { BsEye, BsEyeSlash } from "react-icons/bs";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: FieldError;
}

export const TextInput = forwardRef<HTMLInputElement, Props>(function TextInput(
  { label, error, type = "text", className, ...props },
  ref,
) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm text-gray-600">{label}</label>}
      <div className="relative">
        <input
          {...props}
          ref={ref}
          type={inputType}
          className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary ${
            isPassword ? "pr-10" : ""
          } ${error ? "border-red-500" : "border-line"} ${className ?? ""}`}
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
      {error && <p className="text-xs text-red-500">{error.message}</p>}
    </div>
  );
});
