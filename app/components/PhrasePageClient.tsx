'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { DISPLAY_LOCALE_STORAGE_KEY, DISPLAY_LOCALE_EVENT_NAME } from '@/types/DisplayLocale'
import type { DisplayLocale } from '@/types/DisplayLocale'
import SignupRequiredModal from '@/components/SignupRequiredModal'
import { HiBookmark, HiOutlineBookmark, HiSpeakerWave } from 'react-icons/hi2'
import Link from 'next/link'
import { TYPE_LABEL, REGISTER_LABEL, LOCALE_LABEL, pickLabel } from '@/lib/phraseLabels'
import SensePinButton from '@/components/SensePinButton'
import SenseExample from '@/components/SenseExample'

type PhraseSense = {
  sense_id: string
  meaning_ja: string | null
  meaning_en: string | null
  explanation_ja: string | null
  explanation_en: string | null
  example_en: string | null
  example_ja: string | null
}

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
  senses: PhraseSense[] | null
}

function cleanPhrase(phrase: string): string {
  return phrase.replace(/\s*\([^)]*\)\s*$/, '').trim()
}

const STOP_WORDS = new Set(['a', 'an', 'the', 'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'as', 'is', 'be', 'or', 'and', 'not', 'so', 'but', 'one', 'all', 'out', 'up', 'off', 'had', 'got', 'get', 'do', 'from'])

function getComponentWords(phrase: string): string[] {
  return cleanPhrase(phrase)
    .split(/\s+/)
    .filter(w => /^[a-zA-Z]+$/.test(w) && !STOP_WORDS.has(w.toLowerCase()))
}

export default function PhrasePageClient({ card }: { card: PhraseCard }) {
  const [isSaved, setIsSaved] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [headwordAudioUrl, setHeadwordAudioUrl] = useState<string | null>(null)
  const [headwordAudioLoading, setHeadwordAudioLoading] = useState(false)
  const [exampleAudioUrl, setExampleAudioUrl] = useState<Record<string, string>>({})
  const [exampleAudioLoading, setExampleAudioLoading] = useState<Record<string, boolean>>({})
  const [pinnedSenseId, setPinnedSenseId] = useState<string | null>(null)
  const [displayLocale, setDisplayLocale] = useState<DisplayLocale>(() => {
    if (typeof window === 'undefined') return 'ja'
    return (localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY) as DisplayLocale) ?? 'ja'
  })

  const senses: PhraseSense[] = useMemo(() => {
    if (card.senses && card.senses.length > 0) return card.senses
    // フォールバック: senses が無い旧データ用（backfill 未実行時の安全網）
    if (card.meaning_ja || card.meaning_en) {
      return [{
        sense_id: 'legacy',
        meaning_ja: card.meaning_ja,
        meaning_en: card.meaning_en,
        explanation_ja: card.explanation_ja,
        explanation_en: card.explanation_en,
        example_en: card.example_en,
        example_ja: card.example_ja,
      }]
    }
    return []
  }, [card])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase
        .from('saved_phrase_cards')
        .select('id, pinned_sense_id')
        .eq('user_id', user.id)
        .eq('phrase_card_id', card.id)
        .maybeSingle()
      setIsSaved(!!data)
      setPinnedSenseId(data?.pinned_sense_id ?? null)
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

  const playExampleAudio = async (senseId: string) => {
    const cached = exampleAudioUrl[senseId]
    if (cached) { new Audio(cached).play(); return }
    setExampleAudioLoading(prev => ({ ...prev, [senseId]: true }))
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_CLOUDRUN_API_URL}/audio/phrase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase_card_id: card.id, sense_id: senseId }),
      })
      const data = await res.json()
      if (data.ok && data.audioUrl) {
        setExampleAudioUrl(prev => ({ ...prev, [senseId]: data.audioUrl }))
        new Audio(data.audioUrl).play()
      }
    } catch { /* silent */ } finally {
      setExampleAudioLoading(prev => ({ ...prev, [senseId]: false }))
    }
  }

  const handleSave = async () => {
    if (!userId) { setShowSignupModal(true); return }
    if (isSaved) {
      await supabase.from('saved_phrase_cards').delete().eq('user_id', userId).eq('phrase_card_id', card.id)
      setIsSaved(false)
    } else {
      await supabase.from('saved_phrase_cards').insert({ user_id: userId, phrase_card_id: card.id })
      setIsSaved(true)
    }
  }

  const togglePin = async (senseId: string) => {
    if (!userId) { setShowSignupModal(true); return }
    const next = pinnedSenseId === senseId ? null : senseId
    setPinnedSenseId(next)
    if (isSaved) {
      await supabase.from('saved_phrase_cards')
        .update({ pinned_sense_id: next })
        .eq('user_id', userId).eq('phrase_card_id', card.id)
    } else {
      await supabase.from('saved_phrase_cards')
        .insert({ user_id: userId, phrase_card_id: card.id, pinned_sense_id: next })
      setIsSaved(true)
    }
  }

  const typeLabel = pickLabel(TYPE_LABEL, card.type, displayLocale)
  const registerLabel = card.register && card.register !== 'neutral'
    ? pickLabel(REGISTER_LABEL, card.register, displayLocale)
    : null
  const localeLabel = pickLabel(LOCALE_LABEL, card.locale, displayLocale)
  const componentWords = getComponentWords(card.phrase)

  return (
    <div className="bg-surface min-h-screen">
      {showSignupModal && <SignupRequiredModal onClose={() => setShowSignupModal(false)} />}
      <div className="max-w-[640px] mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border border-line px-5 py-5">

          {/* タイトル + 再生 + ブックマーク */}
          <div className="flex items-start justify-between mb-3 gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <h1 className="text-3xl font-bold text-black leading-tight">{cleanPhrase(card.phrase)}</h1>
              <button
                type="button"
                onClick={playHeadwordAudio}
                disabled={headwordAudioLoading}
                className="shrink-0"
              >
                <HiSpeakerWave className={`size-6 ${headwordAudioLoading ? 'text-muted animate-pulse' : 'text-muted'}`} />
              </button>
            </div>
            <button type="button" onClick={handleSave} className="p-2 -mr-2 -mt-1 shrink-0">
              {isSaved
                ? <HiBookmark className="size-6 text-muted" />
                : <HiOutlineBookmark className="size-6 text-primary" />
              }
            </button>
          </div>

          {/* メタバッジ */}
          {(typeLabel || localeLabel || registerLabel) && (
            <div className="flex flex-wrap items-center gap-1.5 mb-4">
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
          )}

          {/* Senses ループ */}
          <div className="flex flex-col gap-5">
            {senses.map((sense, idx) => {
              const meaning = displayLocale === 'ja'
                ? (sense.meaning_ja ?? sense.meaning_en ?? '')
                : (sense.meaning_en ?? sense.meaning_ja ?? '')
              const explanation = displayLocale === 'ja'
                ? (sense.explanation_ja ?? sense.explanation_en ?? null)
                : (sense.explanation_en ?? sense.explanation_ja ?? null)
              const isPinned = pinnedSenseId === sense.sense_id
              const hasMultiple = senses.length > 1

              return (
                <div key={sense.sense_id} className="group flex items-start gap-2 rounded-xl -mx-3 px-3 py-2 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    {meaning && (
                      <p className="text-base font-medium text-black">
                        {hasMultiple && (
                          <span className="text-muted mr-1.5">{idx + 1}.</span>
                        )}
                        {meaning}
                      </p>
                    )}
                    {explanation && (
                      <p className="mt-1 text-sm text-black">{explanation}</p>
                    )}
                    <SenseExample
                      example={sense.example_en}
                      translation={sense.example_ja}
                      displayLocale={displayLocale}
                      onPlay={() => playExampleAudio(sense.sense_id)}
                      isLoading={!!exampleAudioLoading[sense.sense_id]}
                    />
                  </div>

                  {hasMultiple && (
                    <SensePinButton
                      isPinned={isPinned}
                      onToggle={() => togglePin(sense.sense_id)}
                      displayLocale={displayLocale}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* 構成単語リンク */}
          {componentWords.length > 0 && (
            <div className="border-t border-line pt-4 mt-5">
              <p className="text-xs text-muted mb-2">{displayLocale === 'ja' ? '構成単語' : 'Component words'}</p>
              <div className="flex flex-wrap gap-2">
                {componentWords.map(w => (
                  <Link
                    key={w}
                    href={`/word/${w}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {w}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
