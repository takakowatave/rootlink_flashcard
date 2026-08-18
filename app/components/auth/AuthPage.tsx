"use client";

import Link from "next/link";

export default function AuthPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-start justify-center bg-gray-100 px-4 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(6rem,env(safe-area-inset-bottom))] md:pt-24 md:pb-32">
      <div className="w-full max-w-md">{children}</div>

      <footer className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-1 text-xs text-gray-400">
        <div className="flex gap-6">
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">
            プライバシーポリシー
          </Link>
          <a
            href="https://tally.so/r/ODJoEY"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-600 transition-colors"
          >
            お問い合わせ
          </a>
        </div>
        <p>© 2026 RootLink. All rights reserved.</p>
      </footer>
    </div>
  );
}
