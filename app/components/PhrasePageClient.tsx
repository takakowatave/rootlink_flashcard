'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { DISPLAY_LOCALE_STORAGE_KEY, DISPLAY_LOCALE_EVENT_NAME } from '@/types/DisplayLocale'
import type { DisplayLocale } from '@/types/DisplayLocale'
import { HiBookmark, HiOutlineBookmark } from 'react-icons/hi2'

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

const TYPE_LABEL: Record<string, { en: string; ja: string }> = {
  idiom:             { en: 'Idiom',             ja: 'イディオム' },
  phrasal_verb:      { en: 'Phrasal verb',       ja: '句動詞' },
  fixed_expression:  { en: 'Fixed expression',   ja: '固定表現' },
  spoken_expression: { en: 'Spoken expression',  ja: '会話表現' },
  collocation:       { en: 'Collocation',        ja: 'コロケーション' },
  pattern:           { en: 'Pattern',            ja: '構文パターン' },
  expression:        { en: 'Expression',         ja: '表現' },
}

const REGISTER_LABEL: Record<string, string> = {
  formal: 'Formal', informal: 'Informal', slang: 'Slang', literary: 'Literary',
}

function cleanPhrase(phrase: string): string {
  return phrase.replace(/\s*\([^)]*\)\s*$/, '').trim()
}

export default function PhrasePageClient({ card }: { card: PhraseCard }) {
  const [isSaved, setIsSaved] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [displayLocale, setDisplayLocale] = useState<DisplayLocale>(() => {
    if (typeof window === 'undefined') return 'ja'
    return (localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY) as DisplayLocale) ?? 'ja'
  })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase
        .from('saved_phrase_cards').select('id').eq('user_id', user.id).eq('phrase_card_id', card.id).maybeSingle()
      setIsSaved(!!data)
    }
    load()
  }, [card.id])

  useEffect(() => {
    const handler = () => {
      const saved = localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY) as DisplayLocale | null
      if (saved) setDisplayLocale(saved)
    }
    window.addEventListener(DISPLAY_LOCALE_EVENT_NAME, handler)
    return () => window.removeEventListener(DISPLAY_LOCALE_EVENT_NAME, handler)
  }, [])

  const handleSave = async () => {
    if (!userId) return
    if (isSaved) {
      await supabase.from('saved_phrase_cards').delete().eq('user_id', userId).eq('phrase_card_id', card.id)
      setIsSaved(false)
    } else {
      await supabase.from('saved_phrase_cards').insert({ user_id: userId, phrase_card_id: card.id })
      setIsSaved(true)
    }
  }

  const meaning = displayLocale === 'ja'
    ? (card.meaning_ja ?? card.meaning_en ?? '')
    : (card.meaning_en ?? card.meaning_ja ?? '')
  const explanation = displayLocale === 'ja'
    ? (card.explanation_ja ?? card.explanation_en ?? null)
    : (card.explanation_en ?? card.explanation_ja ?? null)

  const typeInfo = card.type ? TYPE_LABEL[card.type] : null
  const typeLabel = typeInfo ? (displayLocale === 'ja' ? typeInfo.ja : typeInfo.en) : null

  return (
    <div className="bg-surface min-h-screen">
      <div className="flex justify-center w-full">
        <div className="w-full max-w-[600px] md:px-4 md:py-3">
          <div className="bg-white md:rounded-lg shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] pt-2 pb-6 px-2">

            {/* HEADER */}
            <div className="flex items-center justify-between py-1 px-1">
              <h1 className="text-2xl font-semibold leading-8 text-black">{cleanPhrase(card.phrase)}</h1>
              <button type="button" onClick={handleSave} className="p-2 -mr-2 -mt-1 shrink-0">
                {isSaved
                  ? <HiBookmark className="size-6 text-muted" />
                  : <HiOutlineBookmark className="size-6 text-primary" />
                }
              </button>
            </div>

            {/* メタ */}
            <div className="flex flex-wrap items-center gap-1.5 px-1 mb-3">
              {typeLabel && (
                <span className="text-xs text-muted border border-line rounded px-1.5 py-0.5">{typeLabel}</span>
              )}
              {card.locale && (
                <span className="text-xs text-muted border border-line rounded px-1.5 py-0.5">
                  {card.locale === 'en-GB' ? 'British English' : 'American English'}
                </span>
              )}
              {card.register && card.register !== 'neutral' && (
                <span className="text-xs text-muted border border-line rounded px-1.5 py-0.5">
                  {REGISTER_LABEL[card.register] ?? card.register}
                </span>
              )}
            </div>

            {/* 意味 */}
            {meaning && (
              <div className="px-1 mb-3">
                <p className="text-base text-gray-800">{meaning}</p>
              </div>
            )}

            {/* 説明 */}
            {explanation && (
              <div className="px-1 mb-3">
                <p className="text-sm text-muted">{explanation}</p>
              </div>
            )}

            {/* 例文 */}
            {card.example && (
              <div className="px-1 mt-2">
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <p className="text-sm text-gray-800 italic">{card.example}</p>
                  {card.example_ja && displayLocale === 'ja' && (
                    <p className="text-xs text-muted mt-1">{card.example_ja}</p>
                  )}
                </div>
              </div>
            )}

            {/* 覚えるポイント */}
            {card.usage_tip && (
              <div className="mt-3 px-1">
                <p className="text-sm text-primary">💡 {card.usage_tip}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
