'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { DISPLAY_LOCALE_STORAGE_KEY, DISPLAY_LOCALE_EVENT_NAME } from '@/types/DisplayLocale'
import type { DisplayLocale } from '@/types/DisplayLocale'
import PhraseCard, { type PhraseCardData } from '@/components/PhraseCard'

type PhraseCardRow = PhraseCardData & {
  explanation_ja: string | null
  explanation_en: string | null
  created_at: string
  skip_reason: string | null
}

function isToday(dateStr: string): boolean {
  const today = new Date().toLocaleDateString('sv')
  const localDate = new Date(dateStr).toLocaleDateString('sv')
  return localDate === today
}

function PhraseCardWithAudio({
  card, displayLocale, isSaved, onSave,
}: {
  card: PhraseCardRow
  displayLocale: DisplayLocale
  isSaved: boolean
  onSave: () => void
}) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioLoading, setAudioLoading] = useState(false)
  const [headwordAudioUrl, setHeadwordAudioUrl] = useState<string | null>(null)
  const [headwordAudioLoading, setHeadwordAudioLoading] = useState(false)

  const playAudio = async () => {
    if (audioUrl) { new Audio(audioUrl).play(); return }
    setAudioLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_CLOUDRUN_API_URL}/audio/phrase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase_card_id: card.id }),
      })
      const data = await res.json()
      if (data.ok && data.audioUrl) { setAudioUrl(data.audioUrl); new Audio(data.audioUrl).play() }
    } catch { /* silent */ } finally { setAudioLoading(false) }
  }

  const playHeadwordAudio = async () => {
    if (headwordAudioUrl) { new Audio(headwordAudioUrl).play(); return }
    setHeadwordAudioLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_CLOUDRUN_API_URL}/audio/phrase/headword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase_card_id: card.id }),
      })
      const data = await res.json()
      if (data.ok && data.audioUrl) { setHeadwordAudioUrl(data.audioUrl); new Audio(data.audioUrl).play() }
    } catch { /* silent */ } finally { setHeadwordAudioLoading(false) }
  }

  return (
    <PhraseCard
      card={card}
      isSaved={isSaved}
      onSave={onSave}
      displayLocale={displayLocale}
      onPlayHeadword={playHeadwordAudio}
      headwordAudioLoading={headwordAudioLoading}
      onPlayExample={playAudio}
      exampleAudioLoading={audioLoading}
    />
  )
}

function PhrasesPageInner() {
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('q') ?? ''
  const highlightRef = useRef<HTMLDivElement>(null)

  const [cards, setCards] = useState<PhraseCardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)
  const [todayOnly, setTodayOnly] = useState(searchParams.get('today') === '1')
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
          .select('id, phrase, meaning_ja, meaning_en, explanation_ja, explanation_en, example_en, example_ja, type, register, locale, senses, created_at, skip_reason')
          .order('created_at', { ascending: false })
          .limit(200),
        user
          ? supabase.from('saved_phrase_cards').select('phrase_card_id').eq('user_id', user.id)
          : Promise.resolve({ data: [] }),
      ])
      setCards((cardsRes.data ?? []) as PhraseCardRow[])
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

  useEffect(() => {
    if (searchQuery && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [searchQuery, loading])

  const displayed = todayOnly ? cards.filter(c => isToday(c.created_at)) : cards
  const todayCount = cards.filter(c => isToday(c.created_at)).length
  const matchedId = searchQuery
    ? cards.find(c => c.phrase.toLowerCase() === searchQuery.toLowerCase())?.id
    : null
  const keptCards = displayed.filter(c => !c.skip_reason)
  const droppedCards = displayed.filter(c => !!c.skip_reason)

  return (
    <div className="bg-surface min-h-screen">
      <div className="flex justify-center w-full">
        <div className="w-full max-w-[812px] px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-950">表現・フレーズ</h1>
            <span className="text-sm text-muted">{displayed.length}件</span>
          </div>

          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setTodayOnly(false)}
              className={`text-sm font-medium px-3 py-1 rounded-full border transition-colors ${!todayOnly ? 'bg-primary text-white border-primary' : 'border-line text-muted bg-white'}`}
            >
              すべて
            </button>
            <button
              onClick={() => setTodayOnly(true)}
              className={`text-sm font-medium px-3 py-1 rounded-full border transition-colors ${todayOnly ? 'bg-primary text-white border-primary' : 'border-line text-muted bg-white'}`}
            >
              今日追加 {todayCount > 0 && <span className="ml-1">{todayCount}</span>}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <svg className="size-6 animate-spin text-muted" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : displayed.length === 0 ? (
            <p className="text-sm text-muted text-center py-16">
              {todayOnly ? '今日の追加はまだありません' : 'フレーズがありません'}
            </p>
          ) : (
            <>
              {keptCards.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-baseline justify-between mb-2 px-1">
                    <h2 className="text-sm font-semibold text-gray-700">残す</h2>
                    <span className="text-xs text-muted">{keptCards.length}件</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {keptCards.map((card) => (
                      <div key={card.id} ref={card.id === matchedId ? highlightRef : null}
                        className={card.id === matchedId ? 'ring-2 ring-primary rounded-lg' : ''}>
                        <PhraseCardWithAudio
                          card={card}
                          displayLocale={displayLocale}
                          isSaved={savedIds.has(card.id)}
                          onSave={() => handleSave(card.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {droppedCards.length > 0 && (
                <div className="mt-8 pt-6 border-t-2 border-dashed border-line">
                  <div className="flex items-baseline justify-between mb-2 px-1">
                    <h2 className="text-sm font-semibold text-red-600">脱落（gate落ち・削除候補）</h2>
                    <span className="text-xs text-muted">{droppedCards.length}件</span>
                  </div>
                  <div className="flex flex-col gap-3 opacity-60">
                    {droppedCards.map((card) => (
                      <div key={card.id} ref={card.id === matchedId ? highlightRef : null}
                        className={card.id === matchedId ? 'ring-2 ring-primary rounded-lg' : ''}>
                        <PhraseCardWithAudio
                          card={card}
                          displayLocale={displayLocale}
                          isSaved={savedIds.has(card.id)}
                          onSave={() => handleSave(card.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PhrasesPage() {
  return (
    <Suspense>
      <PhrasesPageInner />
    </Suspense>
  )
}
