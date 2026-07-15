'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { DISPLAY_LOCALE_STORAGE_KEY, DISPLAY_LOCALE_EVENT_NAME } from '@/types/DisplayLocale'
import type { DisplayLocale } from '@/types/DisplayLocale'
import SignupRequiredModal from '@/components/SignupRequiredModal'
import { HiBookmark, HiOutlineBookmark, HiSpeakerWave } from 'react-icons/hi2'
import Link from 'next/link'
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
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioLoading, setAudioLoading] = useState(false)
  const [headwordAudioUrl, setHeadwordAudioUrl] = useState<string | null>(null)
  const [headwordAudioLoading, setHeadwordAudioLoading] = useState(false)
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

  const meaning = displayLocale === 'ja'
    ? (card.meaning_ja ?? card.meaning_en ?? '')
    : (card.meaning_en ?? card.meaning_ja ?? '')
  const explanation = displayLocale === 'ja'
    ? (card.explanation_ja ?? card.explanation_en ?? null)
    : (card.explanation_en ?? card.explanation_ja ?? null)

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

          {/* 意味 */}
          {meaning && (
            <p className="text-lg text-gray-800 mb-3">{meaning}</p>
          )}

          {/* 説明 */}
          {explanation && (
            <p className="text-sm text-muted mb-4">{explanation}</p>
          )}

          {/* 例文 */}
          {card.example_en && (
            <div className="bg-gray-50 rounded-lg px-4 py-3 mb-4">
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
          )}

          {/* 構成単語リンク */}
          {componentWords.length > 0 && (
            <div className="border-t border-line pt-4 mt-2">
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
