import Image from 'next/image'
import Link from 'next/link'

export default function LPFooter() {
  return (
    <footer className="w-full bg-[#1a2438] py-10">
      <div className="mx-auto flex max-w-[980px] flex-col items-center gap-6 px-4 md:px-6">
        <Image
          src="/lp/logo-white.svg"
          alt="RootLink"
          width={120}
          height={28}
          className="h-7 w-auto"
        />

        <div className="flex items-center gap-6 text-[13px] text-[#8899aa]">
          <Link href="/privacy" className="transition-colors hover:text-white">
            プライバシーポリシー
          </Link>
          <a
            href="https://tally.so/r/ODJoEY"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-white"
          >
            お問い合わせ
          </a>
        </div>

        <p className="text-[12px] text-[#556070]">
          © 2026 RootLink. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
