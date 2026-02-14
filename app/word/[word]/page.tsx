import { redirect } from 'next/navigation'
import WordPageClient from '@/components/WordPageClient'
import { normalizeWord } from '@/lib/normalize'

export default async function Page({ params }: { params: { word: string } }) {
  const raw = decodeURIComponent(params.word).toLowerCase()
  const normalized = normalizeWord(raw)

  if (normalized !== raw.toLowerCase()) {
    redirect(`/word/${normalized}`)
  }

  return <WordPageClient word={normalized} />
}




