import Link from 'next/link'
import Button from '@/components/Button'
import { detectServerLocale } from '@/lib/serverLocale'

export default function NotFound() {
  const locale = detectServerLocale()
  const t = locale === 'ja'
    ? {
        title: 'ページが見つかりません',
        body: 'URL が間違っているか、ページが移動または削除された可能性があります。',
        home: 'ホームへ戻る',
      }
    : {
        title: 'Page not found',
        body: 'The URL may be wrong, or the page may have been moved or removed.',
        home: 'Back to home',
      }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-bold text-primary md:text-7xl">404</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900 md:text-3xl">
        {t.title}
      </h1>
      <p className="mt-3 text-sm text-gray-500">
        {t.body}
      </p>
      <Link href="/" className="mt-8">
        <Button variant="primary" size="md" radius="full">
          {t.home}
        </Button>
      </Link>
    </div>
  )
}
