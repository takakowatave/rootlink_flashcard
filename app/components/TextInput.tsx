"use client";

import { useState } from "react";
import { FieldError } from "react-hook-form";

/**
 * TextInput
 *
 * フォーム用の汎用 Input コンポーネント。
 *
 * 主な用途：
 * - ログイン / サインアップフォーム
 * - パスワード入力（表示・非表示トグル付き）
 * - react-hook-form と組み合わせたバリデーション表示
 *
 * 特徴：
 * - type="password" の場合のみ、入力内容の表示/非表示を切り替え可能
 * - label / error 表示を内包しているため、フォーム側の記述を簡潔にできる
 * - 通常の text / email / password input としても使用可能
 *
 * 注意：
 * - useState / onClick を使用するため Client Component
 * - SearchForm などの軽量UIでは使用せず、認証系フォーム向け
 */
interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;        // 入力欄のラベル（任意）
  error?: FieldError;    // react-hook-form のエラーオブジェクト（任意）
}

export function TextInput({
    label,
    error,
    type = "text",
    ...props
    }: Props) {
    const [show, setShow] = useState(false);

    // password の場合のみ、表示/非表示を切り替える
    const inputType =
        type === "password" ? (show ? "text" : "password") : type;

    return (
        <div className="flex flex-col gap-1 relative">
        {label && <label className="text-sm font-medium">{label}</label>}

        <div className="relative">
            <input
            {...props}
            type={inputType}
            className={`border py-3 px-3 rounded w-full pr-10 ${
                error ? "border-red-500" : "border-gray-300"
            }`}
            />

            {/* パスワード入力時のみ表示切り替えボタンを表示 */}
            {type === "password" && (
            <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                onClick={() => setShow(!show)}
            >
                {show ? "👁️" : "👁️‍🗨️"}
            </button>
            )}
        </div>

        {/* バリデーションエラー表示 */}
        {error && (
            <p className="text-sm text-red-500">{error.message}</p>
        )}
        </div>
    );
}
