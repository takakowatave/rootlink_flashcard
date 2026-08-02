'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Button from '@/components/Button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-bold text-primary md:text-7xl">Error</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900 md:text-3xl">
        問題が発生しました
      </h1>
      <p className="mt-3 text-sm text-gray-500">
        時間をおいてもう一度お試しください。
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Button variant="primary" size="md" radius="full" onClick={() => reset()}>
          再試行
        </Button>
        <Link href="/">
          <Button variant="secondary" size="md" radius="full">
            ホームへ戻る
          </Button>
        </Link>
      </div>
    </div>
  )
}
