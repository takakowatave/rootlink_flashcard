'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import SearchForm from '@/components/search-form'

export default function HomePage() {
  const router = useRouter()
  const [value, setValue] = useState('')

  const handleSubmit = () => {
    if (!value) return
    console.log('HomePage search submit', value)

    const trimmed = value.trim()
    const slug = trimmed.toLowerCase().replace(/\s+/g, '-')

    // スペースあり → lexical unit（idiom / phrasal verb などは後で分類）
    if (trimmed.includes(' ')) {
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
    </main>
  )
}
