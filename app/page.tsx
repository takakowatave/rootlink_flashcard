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

    // 仮ルール：スペースを含む = idiom
    if (trimmed.includes(' ')) {
      const slug = trimmed.replace(/\s+/g, '-')
      router.push(`/idiom/${slug}`)
      return
    }

    // 単語
    router.push(`/word/${trimmed}`)
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
