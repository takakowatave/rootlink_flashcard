import WordPageClient from '@/components/WordPageClient'

export default async function Page({ params }: { params: { word: string } }) {
  const raw = decodeURIComponent(params.word).trim().toLowerCase()
  return <WordPageClient word={raw} />
}




