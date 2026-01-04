'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import SearchForm from '@/components/search-form'

export default function HomePage() {
  const router = useRouter()
  const [value, setValue] = useState('')

  const handleSubmit = () => {
    if (!value) return
    router.push(`/word/${value}`)
  }

  return (
    <main>
      <SearchForm value={value} onChange={setValue} onSubmit={handleSubmit} />
    </main>
  )
}
