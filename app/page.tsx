'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import SearchForm from '@/components/search-form'
import { guardQuery } from '@/lib/queryGuard'

export default function HomePage() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!value) return

    const trimmed = value.trim()

    // 🔒 ① ここで生成前ガード（唯一の門番）
    const guard = await guardQuery(trimmed, 60)

    if (!guard.ok) {
      // ❌ ページ生成も遷移も一切しない
      setError(guard.reason)
      return
    }

    setError(null)

    const slug = guard.normalized.replace(/\s+/g, '-')

    // スペースあり → lexical unit
    if (guard.normalized.includes(' ')) {
      router.push(`/lexical-unit/${slug}`)
      return
    }

    // 単語
    router.push(`/word/${slug}`)
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
          {error === 'NON_ALPHABET' && 'アルファベットのみ入力できます'}
          {error === 'TOO_LONG' && '入力が長すぎます'}
          {error === 'NOT_EXIST' && '英語として確認できませんでした'}
        </p>
      )}
    </main>
  )
}
