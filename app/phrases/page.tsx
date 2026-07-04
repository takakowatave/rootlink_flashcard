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
  phrasal_verb:  { en: 'Phrasal verb',  ja: '句動詞' },
  collocation:   { en: 'Collocation',   ja: 'コロケーション' },
  idiom:         { en: 'Idiom',         ja: 'イディオム' },
  expression:    { en: 'Expression',    ja: '表現' },
  conjunction:   { en: 'Conjunction',   ja: '接続詞用法' },
}

const REGISTER_LABEL: Record<string, string> = {
  formal: 'Formal', informal: 'Informal', slang: 'Slang', literary: 'Literary',
}

function cleanPhrase(phrase: string): string {
  return phrase.replace(/\s*\([^)]*\)\s*$/, '').trim()
}

function PhraseCardItem({
  card,
  displayLocale,
  isSaved,
  onSave,
}: {
  card: PhraseCard
  displayLocale: DisplayLocale
  isSaved: boolean
  onSave: () => void
}) {
  const meaning = displayLocale === 'ja'
    ? (card.meaning_ja ?? card.meaning_en ?? '')
    : (card.meaning_en ?? card.meaning_ja ?? '')
  const explanation = displayLocale === 'ja'
    ? (card.explanation_ja ?? card.explanation_en ?? null)
    : (card.explanation_en ?? card.explanation_ja ?? null)

  const typeInfo = card.type ? TYPE_LABEL[card.type] : null
  const typeLabel = typeInfo ? (displayLocale === 'ja' ? typeInfo.ja : typeInfo.en) : null

  return (
    <div className="bg-white md:rounded-lg shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] pt-2 pb-3 px-2 mx-auto max-w-[600px] w-full">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between py-1 px-1">
        <div className="flex items-start gap-2 min-w-0">
          <h2 className="text-2xl font-semibold leading-8 text-black">{cleanPhrase(card.phrase)}</h2>
        </div>
        <button type="button" onClick={onSave} className="p-2 -mr-2 -mt-1 shrink-0">
          {isSaved
            ? <HiBookmark className="size-6 text-muted" />
            : <HiOutlineBookmark className="size-6 text-primary" />
          }
        </button>
      </div>

      {/* タイプ・メタ */}
      <div className="flex items-center gap-1.5 px-1 mb-2">
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
        <div className="px-1 mb-2">
          <p className="text-base text-gray-800">{meaning}</p>
        </div>
      )}

      {/* 説明 */}
      {explanation && (
        <div className="px-1 mb-2">
          <p className="text-sm text-muted">{explanation}</p>
        </div>
      )}

      {/* 例文 */}
      {card.example && (
        <div className="mt-2 px-1">
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
        <div className="mt-2 px-1">
          <p className="text-sm text-primary">💡 {card.usage_tip}</p>
        </div>
      )}
    </div>
  )
}

export default function PhrasesPage() {
  const [cards, setCards] = useState<PhraseCard[]>([])
  const [loading, setLoading] = useState(true)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)
  const [displayLocale, setDisplayLocale] = useState<DisplayLocale>(() => {
    if (typeof window === 'undefined') return 'ja'
    return (localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY) as DisplayLocale) ?? 'ja'
  })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)

      const [cardsRes, savedRes] = await Promise.all([
        supabase.from('phrase_cards')
          .select('id, phrase, meaning_ja, meaning_en, explanation_ja, explanation_en, example, example_ja, usage_tip, type, register, locale')
          .order('created_at', { ascending: false })
          .limit(200),
        user ? supabase.from('saved_phrase_cards').select('phrase_card_id').eq('user_id', user.id) : Promise.resolve({ data: [] }),
      ])
      setCards((cardsRes.data ?? []) as PhraseCard[])
      setSavedIds(new Set((savedRes.data ?? []).map((r: { phrase_card_id: string }) => r.phrase_card_id)))
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

  const handleSave = async (cardId: string) => {
    if (!userId) return
    if (savedIds.has(cardId)) {
      await supabase.from('saved_phrase_cards').delete().eq('user_id', userId).eq('phrase_card_id', cardId)
      setSavedIds(prev => { const s = new Set(prev); s.delete(cardId); return s })
    } else {
      await supabase.from('saved_phrase_cards').insert({ user_id: userId, phrase_card_id: cardId })
      setSavedIds(prev => new Set(prev).add(cardId))
    }
  }

  return (
    <div className="bg-surface min-h-screen">
      <div className="flex justify-center w-full">
        <div className="w-full max-w-[812px] px-4 py-6">
          <div className="flex items-center justify-between mb-6">
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
              {cards.map((card) => (
                <PhraseCardItem
                  key={card.id}
                  card={card}
                  displayLocale={displayLocale}
                  isSaved={savedIds.has(card.id)}
                  onSave={() => handleSave(card.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
