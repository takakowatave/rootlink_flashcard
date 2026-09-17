'use client'

import Link from 'next/link'
import { openExternalLink } from '@/lib/openExternal'

const CONTACT_URL = 'https://tally.so/r/ODJoEY'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-line pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] px-4 text-center text-xs text-gray-400">
      <div className="flex justify-center gap-6 mb-2">
        <Link href="/blog" className="hover:text-gray-600 transition-colors">
          Blog
        </Link>
        <Link href="/privacy" className="hover:text-gray-600 transition-colors">
          プライバシーポリシー
        </Link>
        <Link href="/terms" className="hover:text-gray-600 transition-colors">
          利用規約
        </Link>
        <button
          type="button"
          onClick={() => openExternalLink(CONTACT_URL)}
          className="hover:text-gray-600 transition-colors"
        >
          お問い合わせ
        </button>
      </div>
      <p>© 2026 RootLink. All rights reserved.</p>
    </footer>
  )
}
