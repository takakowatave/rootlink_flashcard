'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { DISPLAY_LOCALE_STORAGE_KEY, DISPLAY_LOCALE_EVENT_NAME } from '@/types/DisplayLocale'
import type { DisplayLocale } from '@/types/DisplayLocale'

type PhraseCard = {
  id: string
  phrase: string
  meaning_ja: string | null
  meaning_en: string | null
  explanation_ja: string | null
  explanation_en: string | null
  example: string | null
  example_ja: string | null
  usage_tip: string | null
  type: string | null
  register: string | null
  locale: string | null
}

const REGISTER_LABEL: Record<string, string> = {
  formal: 'Formal',
  informal: 'Informal',
  neutral: 'Neutral',
  slang: 'Slang',
  literary: 'Literary',
}

export default function PhrasesPage() {
  const [cards, setCards] = useState<PhraseCard[]>([])
  const [loading, setLoading] = useState(true)
  const [displayLocale, setDisplayLocale] = useState<DisplayLocale>(() => {
    if (typeof window === 'undefined') return 'ja'
    return (localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY) as DisplayLocale) ?? 'ja'
  })

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('phrase_cards')
        .select('id, phrase, meaning_ja, meaning_en, explanation_ja, explanation_en, example, example_ja, usage_tip, type, register, locale')
        .order('created_at', { ascending: false })
        .limit(200)
      setCards((data ?? []) as PhraseCard[])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    const handler = () => {
      const saved = localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY) as DisplayLocale | null
      if (saved) setDisplayLocale(saved)
    }
    window.addEventListener(DISPLAY_LOCALE_EVENT_NAME, handler)
    return () => window.removeEventListener(DISPLAY_LOCALE_EVENT_NAME, handler)
  }, [])

  return (
    <div className="bg-surface min-h-screen">
      <div className="flex justify-center w-full">
        <div className="w-full max-w-[812px] px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-950">表現・フレーズ</h1>
            <span className="text-sm text-muted">{cards.length}件</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <svg className="size-6 animate-spin text-muted" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {cards.map((card) => {
                const meaning = displayLocale === 'ja'
                  ? (card.meaning_ja ?? card.meaning_en ?? '')
                  : (card.meaning_en ?? card.meaning_ja ?? '')
                const explanation = displayLocale === 'ja'
                  ? (card.explanation_ja ?? card.explanation_en ?? null)
                  : (card.explanation_en ?? card.explanation_ja ?? null)
                const exampleTranslation = displayLocale === 'ja' ? card.example_ja : null

                return (
                  <div key={card.id} className="bg-white border border-line rounded-xl px-5 py-4">
                    {/* フレーズ + メタ */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-lg font-bold text-gray-950 leading-snug">{card.phrase}</p>
                      <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                        {card.locale && (
                          <span className="text-[11px] text-muted border border-line rounded px-1.5 py-0.5">
                            {card.locale === 'en-GB' ? 'GB' : 'US'}
                          </span>
                        )}
                        {card.register && card.register !== 'neutral' && (
                          <span className="text-[11px] text-muted border border-line rounded px-1.5 py-0.5">
                            {REGISTER_LABEL[card.register] ?? card.register}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 意味 */}
                    {meaning && (
                      <p className="text-sm text-gray-700 mb-2">{meaning}</p>
                    )}

                    {/* 説明 */}
                    {explanation && (
                      <p className="text-sm text-muted mb-2">{explanation}</p>
                    )}

                    {/* 例文 */}
                    {card.example && (
                      <div className="mt-2 pl-3 border-l-2 border-line">
                        <p className="text-sm text-gray-800 italic">{card.example}</p>
                        {exampleTranslation && (
                          <p className="text-xs text-muted mt-0.5">{exampleTranslation}</p>
                        )}
                      </div>
                    )}

                    {/* 覚えるポイント */}
                    {card.usage_tip && (
                      <p className="text-xs text-primary mt-2">💡 {card.usage_tip}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
