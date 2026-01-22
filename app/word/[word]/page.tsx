// app/word/[word]/page.tsx

import WordPageClient from '@/components/WordPageClient'

export default async function Page({
  params,
}: {
  params: { word: string }
}) {
  const word = params.word

  // Serverは一切ロジックを持たない
  // 表示・生成はすべてClientに委譲
  return <WordPageClient word={word} />
}
