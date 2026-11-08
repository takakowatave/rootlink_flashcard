'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabaseClient'
import { DISPLAY_LOCALE_STORAGE_KEY, DISPLAY_LOCALE_EVENT_NAME } from '@/types/DisplayLocale'
import type { DisplayLocale } from '@/types/DisplayLocale'
import { detectDisplayLocale } from '@/lib/displayLocale'
import PhraseCard, { type PhraseCardData } from '@/components/PhraseCard'
import { useTtsAudio } from '@/lib/useTtsAudio'
import { buildPhraseSpanRegex } from '@/lib/phraseDisplay'
import { jaHighlightMatches } from '@/lib/jaHighlight'

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
  const example = useTtsAudio({
    endpoint: '/audio/phrase',
    body: { phrase_card_id: card.id },
    playbackRate: 1.2,
  })
  const headword = useTtsAudio({
    endpoint: '/audio/phrase/headword',
    body: { phrase_card_id: card.id },
  })

  return (
    <PhraseCard
      card={card}
      isSaved={isSaved}
      onSave={onSave}
      displayLocale={displayLocale}
      onPlayHeadword={headword.play}
      headwordAudioLoading={headword.loading}
      onPlayExample={example.play}
      exampleAudioLoading={example.loading}
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
  const [displayLocale, setDisplayLocale] = useState<DisplayLocale>(detectDisplayLocale)
  const L = displayLocale === 'en'
    ? {
        title: 'Phrases',
        count: (n: number) => `${n}`,
        all: 'All',
        today: 'Today',
        emptyToday: 'Nothing added today yet',
        emptyAll: 'No phrases yet',
        saveFailed: 'Failed to save',
        bulkSaved: (n: number) => `Saved ${n}`,
      }
    : {
        title: '表現・フレーズ',
        count: (n: number) => `${n}件`,
        all: 'すべて',
        today: '今日追加',
        emptyToday: '今日の追加はまだありません',
        emptyAll: 'フレーズがありません',
        saveFailed: '保存に失敗しました',
        bulkSaved: (n: number) => `${n}件保存しました`,
      }

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)

      const [cardsRes, savedRes] = await Promise.all([
        supabase.from('phrase_cards')
          .select('id, phrase, meaning_ja, meaning_en, explanation_ja, explanation_en, example_en, example_ja, type, register, locale, senses, created_at, skip_reason')
          .not('meaning_ja', 'is', null)
          .is('skip_reason', null)
          .order('created_at', { ascending: false })
          .limit(200),
        user
          ? supabase.from('saved_phrase_cards').select('phrase_card_id').eq('user_id', user.id).limit(5000)
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

  const [bulkSaving, setBulkSaving] = useState(false)
  const handleBulkSave = async (targetIds: string[]) => {
    if (!userId || targetIds.length === 0 || bulkSaving) return
    setBulkSaving(true)
    const { error } = await supabase
      .from('saved_phrase_cards')
      .insert(targetIds.map(phrase_card_id => ({ user_id: userId, phrase_card_id })))
    if (error) {
      toast.error(L.saveFailed)
    } else {
      setSavedIds(prev => {
        const s = new Set(prev)
        for (const id of targetIds) s.add(id)
        return s
      })
      toast.success(L.bulkSaved(targetIds.length))
    }
    setBulkSaving(false)
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

  // 要修正: ハイライトが失敗するカード。英例文に phrase 本体がマッチしない、
  // または meaning_ja の候補が example_ja に出てこないケース。gate 合格済み (skip_reason=null) のみ対象。
  const highlightFailCards = keptCards.filter(c => {
    const enFail = !!c.example_en && !new RegExp(buildPhraseSpanRegex(c.phrase), 'gi').test(c.example_en)
    const jaFail = !!c.meaning_ja && !!c.example_ja && jaHighlightMatches(c.meaning_ja, c.example_ja).length === 0
    return enFail || jaFail
  }).map(c => {
    const enFail = !!c.example_en && !new RegExp(buildPhraseSpanRegex(c.phrase), 'gi').test(c.example_en)
    const jaFail = !!c.meaning_ja && !!c.example_ja && jaHighlightMatches(c.meaning_ja, c.example_ja).length === 0
    return { card: c, enFail, jaFail }
  })

  return (
    <div className="bg-surface min-h-screen">
      <div className="flex justify-center w-full">
        <div className="w-full max-w-[812px] px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-950">{L.title}</h1>
            <span className="text-sm text-muted">{L.count(displayed.length)}</span>
          </div>

          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setTodayOnly(false)}
              className={`text-sm font-medium px-3 py-1 rounded-full border transition-colors ${!todayOnly ? 'bg-primary text-white border-primary' : 'border-line text-muted bg-white'}`}
            >
              {L.all}
            </button>
            <button
              onClick={() => setTodayOnly(true)}
              className={`text-sm font-medium px-3 py-1 rounded-full border transition-colors ${todayOnly ? 'bg-primary text-white border-primary' : 'border-line text-muted bg-white'}`}
            >
              {L.today} {todayCount > 0 && <span className="ml-1">{todayCount}</span>}
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
              {todayOnly ? L.emptyToday : L.emptyAll}
            </p>
          ) : (
            <>
              {keptCards.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2 px-1 gap-3">
                    <h2 className="text-sm font-semibold text-gray-700 shrink-0">残す</h2>
                    <div className="flex items-center gap-3">
                      {userId && (() => {
                        const unsavedIds = keptCards.filter(c => !savedIds.has(c.id)).map(c => c.id)
                        if (unsavedIds.length === 0) return null
                        return (
                          <button
                            onClick={() => handleBulkSave(unsavedIds)}
                            disabled={bulkSaving}
                            className="text-xs font-semibold text-primary border border-primary rounded-full px-3 py-1 hover:bg-primary-subtle transition-colors disabled:opacity-50"
                          >
                            {bulkSaving ? '保存中...' : `まとめて保存 (${unsavedIds.length})`}
                          </button>
                        )
                      })()}
                      <span className="text-xs text-muted">{keptCards.length}件</span>
                    </div>
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
              {highlightFailCards.length > 0 && (
                <div className="mt-8 pt-6 border-t-2 border-dashed border-line">
                  <div className="flex items-baseline justify-between mb-2 px-1">
                    <h2 className="text-sm font-semibold text-quiz-review">要修正（ハイライト失敗）</h2>
                    <span className="text-xs text-muted">{highlightFailCards.length}件</span>
                  </div>
                  <p className="text-xs text-muted mb-3 px-1">
                    例文/訳に phrase 本体がマッチしないカード。例文を書き直すか、meaning_ja と example_ja に共通の語を入れる。
                  </p>
                  <div className="flex flex-col gap-3">
                    {highlightFailCards.map(({ card, enFail, jaFail }) => (
                      <div key={card.id} ref={card.id === matchedId ? highlightRef : null}
                        className={card.id === matchedId ? 'ring-2 ring-primary rounded-lg' : ''}>
                        <div className="mb-1 flex gap-2 text-[11px] font-semibold">
                          {enFail && <span className="rounded bg-quiz-review/10 text-quiz-review px-1.5 py-0.5">EN</span>}
                          {jaFail && <span className="rounded bg-quiz-review/10 text-quiz-review px-1.5 py-0.5">JA</span>}
                        </div>
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
