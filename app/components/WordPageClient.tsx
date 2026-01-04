'use client'

import { useState } from 'react'
import WordCard from '@/components/WordCard'
import { toggleSaveStatus } from '@/lib/supabaseApi'
import type { WordInfo } from '@/types/WordInfo'

type LabeledWord = WordInfo & {
  label?: 'main' | 'synonym' | 'antonym'
}

export default function WordPageClient({
  words,
}: {
  words: LabeledWord[]
}) {
  // 保存済み単語（UI判定用）
  const [savedWords, setSavedWords] = useState<string[]>([])

  const handleSave = async (word: WordInfo) => {
    const isSaved = savedWords.includes(word.word)

    const result = await toggleSaveStatus(word, isSaved)

    if (result.success) {
      setSavedWords((prev) =>
        isSaved
          ? prev.filter((w) => w !== word.word)
          : [...prev, word.word]
      )
    }
  }

  return (
    <main className="w-full">
      {words.map((w) => (
        <WordCard
          key={`${w.word}-${w.label}`}
          word={w}
          label={w.label}
          savedWords={savedWords}
          onSave={handleSave}
        />
      ))}
    </main>
  )
}
