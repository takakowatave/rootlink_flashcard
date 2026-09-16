"use client";

import { ReactNode } from "react";
import { HiOutlineInformationCircle } from "react-icons/hi2";

// 情報バナー。設定画面などで「今こういう状態なので、こう操作してください」
// を柔らかく伝えるための小さな callout。
//
// Figma xe5UwVx38JWu5doqwXczQu / node 2862-5946 に本来の意匠がある。
// 現時点で MCP 認証が通らないため、既存の primary-subtle 系のパレット
// （blog CTA / phrase pill 等で使用）に合わせて実装している。
// 認証が通ったら色・アイコン・角丸を確認する。

interface Props {
  title: string;
  body?: ReactNode;
  children?: ReactNode;
}

export default function InfoBanner({ title, body, children }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-line bg-primary-subtle px-4 py-3">
      <HiOutlineInformationCircle className="size-5 shrink-0 text-primary mt-0.5" aria-hidden />
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-sm font-bold text-gray-950 leading-snug">{title}</p>
        {body && <p className="text-xs text-gray-700 leading-relaxed">{body}</p>}
        {children}
      </div>
    </div>
  );
}
