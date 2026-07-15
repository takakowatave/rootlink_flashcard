'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { DISPLAY_LOCALE_STORAGE_KEY, DISPLAY_LOCALE_EVENT_NAME } from '@/types/DisplayLocale'
import type { DisplayLocale } from '@/types/DisplayLocale'
import { HiBookmark, HiOutlineBookmark, HiSpeakerWave } from 'react-icons/hi2'
import CardShell from '@/components/CardShell'
import { TYPE_LABEL, REGISTER_LABEL, LOCALE_LABEL, pickLabel } from '@/lib/phraseLabels'

type PhraseCard = {
  id: string
  phrase: string
  meaning_ja: string | null
  meaning_en: string | null
  explanation_ja: string | null
  explanation_en: string | null
  example_en: string | null
  example_ja: string | null
  type: string | null
  register: string | null
  locale: string | null
  created_at: string
  skip_reason: string | null
}

function cleanPhrase(phrase: string): string {
  return phrase.replace(/\s*\([^)]*\)\s*$/, '').trim()
}

function isToday(dateStr: string): boolean {
  const today = new Date().toLocaleDateString('sv')
  return dateStr.startsWith(today)
}

function PhraseCardItem({
  card, displayLocale, isSaved, onSave,
}: {
  card: PhraseCard
  displayLocale: DisplayLocale
  isSaved: boolean
  onSave: () => void
}) {
  const router = useRouter()
  const meaning = displayLocale === 'ja'
    ? (card.meaning_ja ?? card.meaning_en ?? '')
    : (card.meaning_en ?? card.meaning_ja ?? '')
  const explanation = displayLocale === 'ja'
    ? (card.explanation_ja ?? card.explanation_en ?? null)
    : (card.explanation_en ?? card.explanation_ja ?? null)

  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioLoading, setAudioLoading] = useState(false)
  const [headwordAudioUrl, setHeadwordAudioUrl] = useState<string | null>(null)
  const [headwordAudioLoading, setHeadwordAudioLoading] = useState(false)

  const playAudio = async (e: ReactMouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
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

  const playHeadwordAudio = async (e: ReactMouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
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

  const typeLabel = pickLabel(TYPE_LABEL, card.type, displayLocale)
  const registerLabel = card.register && card.register !== 'neutral'
    ? pickLabel(REGISTER_LABEL, card.register, displayLocale)
    : null
  const localeLabel = pickLabel(LOCALE_LABEL, card.locale, displayLocale)
  const href = `/word/${cleanPhrase(card.phrase).replace(/\s+/g, '_')}`

  return (
    <CardShell onClick={() => router.push(href)}>
      {/* HEADER */}
      <div className="flex items-center justify-between py-1 px-1 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <h2 className="text-2xl font-semibold leading-8 text-black">{cleanPhrase(card.phrase)}</h2>
          <button
            type="button"
            onClick={playHeadwordAudio}
            disabled={headwordAudioLoading}
            className="shrink-0"
          >
            <HiSpeakerWave className={`size-6 ${headwordAudioLoading ? 'text-muted animate-pulse' : 'text-muted'}`} />
          </button>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSave() }}
          className="p-2 -mr-2 -mt-1 shrink-0"
        >
          {isSaved
            ? <HiBookmark className="size-6 text-muted" />
            : <HiOutlineBookmark className="size-6 text-primary" />
          }
        </button>
      </div>

      {/* メタ */}
      <div className="flex flex-wrap items-center gap-1.5 px-1 mb-2">
        {typeLabel && (
          <span className="text-xs text-muted border border-line rounded px-1.5 py-0.5">{typeLabel}</span>
        )}
        {localeLabel && (
          <span className="text-xs text-muted border border-line rounded px-1.5 py-0.5">{localeLabel}</span>
        )}
        {registerLabel && (
          <span className="text-xs text-muted border border-line rounded px-1.5 py-0.5">{registerLabel}</span>
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
      {card.example_en && (
        <div className="mt-2 px-1">
          <div className="bg-gray-50 rounded-lg px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-gray-800 italic flex-1">{card.example_en}</p>
              <button
                type="button"
                onClick={playAudio}
                disabled={audioLoading}
                className="shrink-0"
              >
                <HiSpeakerWave className={`size-6 ${audioLoading ? 'text-muted animate-pulse' : 'text-muted'}`} />
              </button>
            </div>
            {card.example_ja && displayLocale === 'ja' && (
              <p className="text-xs text-muted mt-1">{card.example_ja}</p>
            )}
          </div>
        </div>
      )}

    </CardShell>
  )
}

function PhrasesPageInner() {
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('q') ?? ''
  const highlightRef = useRef<HTMLDivElement>(null)

  const [cards, setCards] = useState<PhraseCard[]>([])
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
          .select('id, phrase, meaning_ja, meaning_en, explanation_ja, explanation_en, example_en, example_ja, type, register, locale, created_at, skip_reason')
          .order('type', { ascending: true })
          .order('created_at', { ascending: false })
          .limit(200),
        user
          ? supabase.from('saved_phrase_cards').select('phrase_card_id').eq('user_id', user.id)
          : Promise.resolve({ data: [] }),
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

  // ?q= で検索ヒットしたカードをトップに移動 + スクロール
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
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-950">表現・フレーズ</h1>
            <span className="text-sm text-muted">{displayed.length}件</span>
          </div>

          {/* フィルター */}
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
                        <PhraseCardItem
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
                        <PhraseCardItem
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
