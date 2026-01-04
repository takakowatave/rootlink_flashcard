'use client'

/*
 * このページは /word/[word] に対応する
 * 単語詳細ページ。
 *
 * 役割：
 * - URL の word を受け取る
 * - AI API を叩いて単語情報を取得する
 * - related（類義語・反意語）も React時代と同様に再取得する
 * - 完成した WordInfo を WordCard に渡す
 *
 * ※ CSS / UI は WordCard 側に完全に委譲
 */

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import WordCard from '@/components/WordCard'
import type { WordInfo } from '@/types/WordInfo'

/* ---------------------------------------
 * 表示用：WordInfo にラベルを足した型
 * ------------------------------------- */
type LabeledWord = WordInfo & {
  label?: 'main' | 'synonym' | 'antonym'
}

/* ---------------------------------------
 * AI サーバーから返ってくる JSON の形
 * ------------------------------------- */
type AiResponse = {
  main: WordInfo
  related?: {
    synonyms?: string[]
    antonyms?: string[]
  }
}

/* ---------------------------------------
 * AI API を叩く関数
 * - Cloud Run 上の Hono サーバーを経由
 * - parse は server 側で完了している前提
 * ------------------------------------- */
async function fetchFromAI(word: string): Promise<AiResponse> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_CLOUDRUN_API_URL}/chat`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: word }),
    }
  )

  if (!res.ok) {
    throw new Error('AI API failed')
  }

  return res.json()
}

/* ---------------------------------------
 * ページ本体
 * ------------------------------------- */
export default function WordPage() {
  // URL から /word/[word] の word を取得
  const params = useParams<{ word: string }>()
  const wordParam = params.word

  // 表示する単語一覧（main + related）
  const [words, setWords] = useState<LabeledWord[]>([])

  // エラー表示用
  const [error, setError] = useState<string | null>(null)

  /* -----------------------------------
   * 初回 & word 変更時に AI を叩く
   * --------------------------------- */
  useEffect(() => {
    if (!wordParam) return

    const run = async () => {
      try {
        /*
         * ① メイン単語を取得
         */
        const base = await fetchFromAI(wordParam)

        const result: LabeledWord[] = [
          {
            ...base.main,
            label: 'main',
          },
        ]

        /*
         * ② related（類義語・反意語）を
         *    React時代と同じく「単語ごとに再取得」
         */
        const tasks: Promise<LabeledWord>[] = []

        base.related?.synonyms?.forEach((w) => {
          tasks.push(
            fetchFromAI(w).then((r) => ({
              ...r.main,
              label: 'synonym',
            }))
          )
        })

        base.related?.antonyms?.forEach((w) => {
          tasks.push(
            fetchFromAI(w).then((r) => ({
              ...r.main,
              label: 'antonym',
            }))
          )
        })

        const related = await Promise.all(tasks)

        /*
         * ③ main + related をまとめて state に入れる
         */
        setWords([...result, ...related])
      } catch (e) {
        console.error(e)
        setError('AIの結果を取得できませんでした')
      }
    }

    run()
  }, [wordParam])

  /* -----------------------------------
   * エラー表示
   * --------------------------------- */
  if (error) {
    return <p className="text-red-500">{error}</p>
  }

  /* -----------------------------------
   * WordCard にすべて委譲
   * （CSS / 表示ロジックは一切触らない）
   * --------------------------------- */
  return (
    <main className="w-full">
      {words.map((w) => (
        <WordCard
          key={`${w.word}-${w.label}`}
          word={w}
          label={w.label}
          savedWords={[]}
        />
      ))}
    </main>
  )
}
