'use client'

import Image from 'next/image'
import Link from 'next/link'
import { openExternalLink } from '@/lib/openExternal'

const CONTACT_URL = 'https://tally.so/r/ODJoEY'

export default function LPFooter() {
  return (
    <footer className="w-full bg-[#202020] py-10">
      <div className="mx-auto flex max-w-[980px] flex-col items-center gap-6 px-4 md:px-6">
        <Image
          src="/lp/logo-white.svg"
          alt="RootLink"
          width={120}
          height={28}
          className="h-7 w-auto"
        />

        <div className="flex flex-wrap items-center justify-center gap-6 text-[13px] text-[#8899aa]">
          <Link href="/privacy" className="transition-colors hover:text-white">
            プライバシーポリシー
          </Link>
          <Link href="/terms" className="transition-colors hover:text-white">
            利用規約
          </Link>
          <button
            type="button"
            onClick={() => openExternalLink(CONTACT_URL)}
            className="transition-colors hover:text-white"
          >
            お問い合わせ
          </button>
        </div>

        <p className="text-[12px] text-[#556070]">
          © 2026 RootLink. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
