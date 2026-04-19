'use client'

/**
 * app/page.tsx
 *
 * RootLink トップページ。
 *
 * 責務:
 * - ユーザーの検索入力を受け取る
 * - サーバーの /resolve エンドポイントに問い合わせる
 * - サーバーから返された redirectTo に基づいてページ遷移する
 *
 * ※ 辞書判定・フィルタリング・AI生成ロジックは持たない
 *    すべてサーバー側に委譲する
 */

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import LPHero from '@/components/LPHero'

const API_BASE =
  process.env.NEXT_PUBLIC_CLOUDRUN_API_URL ??
  'https://rootlink-server-v2-774622345521.asia-northeast1.run.app'

export default function HomePage() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!value) return
    const trimmed = value.trim()
    if (!trimmed) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      })

      if (!res.ok) { setError('NOT_EXIST'); setIsLoading(false); return }

      const r = await res.json()
      if (!r || r.ok !== true || typeof r.redirectTo !== 'string') {
        setError('NOT_EXIST'); setIsLoading(false); return
      }

      router.push(r.redirectTo)
    } catch {
      setError('NOT_EXIST')
      setIsLoading(false)
    }
  }

  return (
    <main>
      <LPHero
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={error}
      />
    </main>
  )
}