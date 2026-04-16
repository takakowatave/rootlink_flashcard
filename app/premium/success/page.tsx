"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

function PremiumSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push("/wordlist")
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          プレミアム登録完了！
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          ありがとうございます。単語の保存が無制限になりました。
        </p>
        <p className="text-xs text-gray-400 mb-6">
          {countdown}秒後にWordlistへ移動します...
        </p>
        <Link
          href="/wordlist"
          className="inline-block w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          今すぐWordlistへ
        </Link>
      </div>
    </div>
  )
}

export default function PremiumSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">読み込み中...</div>
      </div>
    }>
      <PremiumSuccessContent />
    </Suspense>
  )
}
