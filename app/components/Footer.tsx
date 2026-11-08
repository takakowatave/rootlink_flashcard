'use client'

import Link from 'next/link'
import { openExternalLink } from '@/lib/openExternal'
import { useDisplayLocale } from '@/lib/useDisplayLocale'

const CONTACT_URL = 'https://tally.so/r/ODJoEY'

export default function Footer() {
  const locale = useDisplayLocale()
  const labels = locale === 'ja'
    ? { blog: 'Blog', privacy: 'プライバシーポリシー', terms: '利用規約', contact: 'お問い合わせ' }
    : { blog: 'Blog', privacy: 'Privacy', terms: 'Terms', contact: 'Contact' }

  return (
    <footer className="mt-16 border-t border-line pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] px-4 text-center text-xs text-gray-400">
      <div className="flex justify-center gap-6 mb-2">
        <Link href="/blog" className="hover:text-primary-dark transition-colors">
          {labels.blog}
        </Link>
        <Link href="/privacy" className="hover:text-primary-dark transition-colors">
          {labels.privacy}
        </Link>
        <Link href="/terms" className="hover:text-primary-dark transition-colors">
          {labels.terms}
        </Link>
        <button
          type="button"
          onClick={() => openExternalLink(CONTACT_URL)}
          className="hover:text-primary-dark transition-colors"
        >
          {labels.contact}
        </button>
      </div>
      <p>© 2026 RootLink. All rights reserved.</p>
    </footer>
  )
}
