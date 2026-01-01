'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SearchForm() {
  const [word, setWord] = useState('')
  const router = useRouter()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!word) return
        router.push(`/word/${word}`)
      }}
      className="flex"
    >
      <input
        value={word}
        onChange={(e) => setWord(e.target.value)}
        placeholder="Search a word"
        className="w-full rounded-full border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
    </form>
  )
}
