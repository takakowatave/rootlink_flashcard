import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-100 py-6 px-4 text-center text-xs text-gray-400">
      <div className="flex justify-center gap-6 mb-2">
        <Link href="/privacy" className="hover:text-gray-600 transition-colors">
          プライバシーポリシー
        </Link>
        <a href="mailto:rootlink.japan@gmail.com" className="hover:text-gray-600 transition-colors">
          お問い合わせ
        </a>
      </div>
      <p>© 2026 RootLink. All rights reserved.</p>
    </footer>
  )
}
