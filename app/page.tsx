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
import SearchForm from '@/components/search-form'

/**
 * APIベースURL
 * - NEXT_PUBLIC_API_BASE_URL があればそれを使用
 * - なければCloud Run本番URLを使用
 */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'https://rootlink-server-v2-774622345521.asia-northeast1.run.app'

export default function HomePage() {
  const router = useRouter()

  // 検索入力値
  const [value, setValue] = useState('')

  // エラー表示状態
  const [error, setError] = useState<string | null>(null)

  /**
   * 検索送信処理
   *
   * フロー:
   * 1. 入力値をtrim
   * 2. /resolve にPOST
   * 3. { ok: true, redirectTo: string } を期待
   * 4. redirectTo へ遷移
   */
  const handleSubmit = async () => {
    if (!value) return

    const trimmed = value.trim()
    if (!trimmed) return

    try {
      const res = await fetch(`${API_BASE}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: trimmed }),
      })

      // HTTPエラー
      if (!res.ok) {
        setError('NOT_EXIST')
        return
      }

      const r = await res.json()

      // 期待レスポンス形式チェック
      if (
        !r ||
        typeof r !== 'object' ||
        r.ok !== true ||
        typeof r.redirectTo !== 'string'
      ) {
        setError('NOT_EXIST')
        return
      }

      setError(null)
      router.push(r.redirectTo)
    } catch {
      // 通信エラー
      setError('NOT_EXIST')
    }
  }

  return (
    <main>
      <SearchForm
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
      />

      {error && (
        <p className="mt-2 text-sm text-red-600">
          英語として確認できませんでした
        </p>
      )}
    </main>
  )
}