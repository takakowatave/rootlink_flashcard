'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Button from '@/components/Button'

type Deck = {
  id: string
  name: string
  label: string
  description: string | null
  word_count: number
}

const LABEL_ORDER = ['TOEIC', 'IELTS', 'TOEFL', '英検']

const LABEL_STYLES: Record<string, { badge: string; dot: string }> = {
  TOEIC: { badge: 'bg-blue-50 text-blue-600 border-blue-200', dot: 'bg-blue-400' },
  IELTS: { badge: 'bg-teal-50 text-teal-600 border-teal-200', dot: 'bg-teal-400' },
  TOEFL: { badge: 'bg-violet-50 text-violet-600 border-violet-200', dot: 'bg-violet-400' },
  英検: { badge: 'bg-orange-50 text-orange-600 border-orange-200', dot: 'bg-orange-400' },
}

function shortName(fullName: string, label: string): string {
  return fullName.replace(label, '').trim()
}

export default function DecksPage() {
  const router = useRouter()
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('decks')
        .select('id, name, label, description, word_count')
        .order('label')
        .order('name')
        .limit(100)

      setDecks((data ?? []) as Deck[])
      setLoading(false)
    }
    load()
  }, [])

  const grouped = LABEL_ORDER.reduce<Record<string, Deck[]>>((acc, label) => {
    acc[label] = decks.filter(d => d.label === label)
    return acc
  }, {})

  return (
    <div className="flex flex-col bg-white min-h-screen">
      <header className="h-10 bg-white border-b border-line flex items-center px-2 shrink-0">
        <Button onClick={() => router.back()} variant="secondary" size="sm">戻る</Button>
      </header>

      <div className="max-w-[860px] mx-auto w-full px-6 pt-14 pb-16">
        {/* ページタイトル */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary leading-tight mb-4">
            試験対策の教材も充実
          </h1>
          <p className="text-[15px] text-gray-500 leading-relaxed">
            RootLinkは試験対策にも対応。オリジナルの単語帳も作れますが、<br className="hidden sm:inline" />
            幅広い試験対策の教材も用意しています。
          </p>
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm text-center py-10">読み込み中...</p>
        ) : (
          <div className="flex flex-col gap-10">
            {LABEL_ORDER.map(label => {
              const items = grouped[label]
              if (!items || items.length === 0) return null
              const style = LABEL_STYLES[label] ?? { badge: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' }

              return (
                <section key={label}>
                  {/* ラベルヘッダー */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-semibold ${style.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      {label}
                    </div>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  {/* カードグリッド */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {items.map(deck => (
                      <button
                        key={deck.id}
                        onClick={() => router.push(`/decks/${deck.id}`)}
                        className="bg-white border border-gray-200 rounded-lg p-6 text-left shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:border-primary/40 hover:shadow-[0_0_0_2px_rgba(20,184,166,0.08)] transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <p className="text-2xl font-bold text-gray-900 tracking-tight leading-snug">
                          {shortName(deck.name, label)}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {deck.word_count.toLocaleString()} words
                        </p>
                      </button>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
