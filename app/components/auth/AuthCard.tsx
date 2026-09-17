"use client";

export default function AuthCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  // カード枠 (shadow / rounded / 内側 padding) は廃止。
  // AuthPage 全体で白背景を持ち、content は直置きで width 100%。
  return (
    <div className="w-full">
      <div className="flex justify-center mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="RootLink" className="h-[17px] w-auto" />
      </div>
      <h2 className="text-xl font-semibold text-center mb-6">{title}</h2>
      {children}
    </div>
  );
}
