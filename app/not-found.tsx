import Link from 'next/link'
import Button from '@/components/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-bold text-primary md:text-7xl">404</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900 md:text-3xl">
        ページが見つかりません
      </h1>
      <p className="mt-3 text-sm text-gray-500">
        URL が間違っているか、ページが移動または削除された可能性があります。
      </p>
      <Link href="/" className="mt-8">
        <Button variant="primary" size="md" radius="full">
          ホームへ戻る
        </Button>
      </Link>
    </div>
  )
}
