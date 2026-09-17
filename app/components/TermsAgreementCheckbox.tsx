"use client";

import { forwardRef, type ReactNode } from "react";
import { BsCheck2 } from "react-icons/bs";
import type { FieldError } from "react-hook-form";

// 「利用規約 / プライバシーポリシー に同意する」用のカスタム
// チェックボックス。ブラウザ標準はスマホでズームやプラットフォーム差が
// 大きいので、デザインに合わせて自前で描く。
//
// - 行全体がタップ可能 (min-h-[44px] py-2 で 44px 以上を確保)
// - 本文は text-sm (14px)、tailwind の color/line トークンで統一
// - react-hook-form の register / error に対応
interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: FieldError;
  children: ReactNode;
}

const TermsAgreementCheckbox = forwardRef<HTMLInputElement, Props>(
  function TermsAgreementCheckbox({ error, children, className, ...props }, ref) {
    return (
      <div className="flex flex-col gap-1">
        <label
          className={[
            "flex items-center gap-3 min-h-[44px] py-2 px-1 cursor-pointer select-none",
            className ?? "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <input
            ref={ref}
            type="checkbox"
            className="peer sr-only"
            aria-invalid={!!error}
            {...props}
          />
          <span
            className={[
              "size-5 shrink-0 rounded border bg-white flex items-center justify-center text-transparent transition-colors",
              error ? "border-red-500" : "border-line",
              "peer-checked:bg-primary peer-checked:border-primary peer-checked:text-white",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40",
            ].join(" ")}
          >
            <BsCheck2 size={16} className="text-current" />
          </span>
          <span className="text-sm leading-snug text-gray-700">{children}</span>
        </label>
        {error && <p className="text-xs text-red-500 -mt-1 pl-9">{error.message}</p>}
      </div>
    );
  },
);

export default TermsAgreementCheckbox;
