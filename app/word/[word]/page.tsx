// app/word/[word]/page.tsx
/*
 * /word/[word] に対応する単語詳細ページ（Server）
 *
 * 役割：
 * - URL から word を受け取る
 * - Cloud Run（既存データ取得API）に問い合わせる
 * - あれば Client に初期データとして渡す
 * - なければ Client に「自動生成を開始させる」ための最小情報だけ渡す
 *
 */

import WordPageClient from '@/components/WordPageClient'
import { apiRequest } from '@/lib/apiClient'
import type { WordInfo } from '@/types/WordInfo'

type LabeledWord = WordInfo & {
  label?: 'main' | 'synonym' | 'antonym'
}

type PageState =
  | { status: 'ready'; words: LabeledWord[] }
  | { status: 'not_generated'; words: LabeledWord[] }

export default async function Page({
  params,
}: {
  params: { word: string }
}) {
  const word = params.word

  let state: PageState = { status: 'not_generated', words: [] }

  try {
    const result = await apiRequest(`/word/${word}`, { method: 'GET' })
    state = {
      status: 'ready',
      words: [{ ...(result as WordInfo), label: 'main' }],
    }
  } catch {
    // 取れなければ未生成扱い（ここでは UI に出さない）
    state = { status: 'not_generated', words: [] }
  }

  return (
    <WordPageClient
      word={word}
      status={state.status}
      words={state.words}
    />
  )
}
