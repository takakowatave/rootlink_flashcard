'use client'

import { useEffect, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { HiBookmark, HiOutlineBookmark, HiSpeakerWave } from 'react-icons/hi2'
import { supabase } from '@/lib/supabaseClient'
import { DISPLAY_LOCALE_STORAGE_KEY, DISPLAY_LOCALE_EVENT_NAME } from '@/types/DisplayLocale'
import type { DisplayLocale } from '@/types/DisplayLocale'
import CardShell from '@/components/CardShell'
import SenseExample from '@/components/SenseExample'
import SignupRequiredModal from '@/components/SignupRequiredModal'
import { TYPE_LABEL, REGISTER_LABEL, LOCALE_LABEL, pickLabel } from '@/lib/phraseLabels'

type Sense = {
  sense_id: string
  meaning_ja: string | null
  meaning_en: string | null
  example_en: string | null
  example_ja: string | null
}

export type EmbeddedPhrase = {
  id: string
  phrase: string
  meaning_ja: string | null
  meaning_en: string | null
  example_en: string | null
  example_ja: string | null
  type: string | null
  register: string | null
  locale: string | null
  senses: Sense[] | null
}

function cleanPhrase(phrase: string): string {
  return phrase.replace(/\s*\([^)]*\)\s*$/, '').trim()
}

export default function PhraseCardEmbed({ phrase }: { phrase: EmbeddedPhrase }) {
  const router = useRouter()
  const [isSaved, setIsSaved] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [displayLocale, setDisplayLocale] = useState<DisplayLocale>(() => {
    if (typeof window === 'undefined') return 'ja'
    return (localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY) as DisplayLocale) ?? 'ja'
  })

  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioLoading, setAudioLoading] = useState(false)
  const [headwordAudioUrl, setHeadwordAudioUrl] = useState<string | null>(null)
  const [headwordAudioLoading, setHeadwordAudioLoading] = useState(false)

  useEffect(() => {
    let alive = true
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user || !alive) return
      setUserId(user.id)
      const { data } = await supabase
        .from('saved_phrase_cards')
        .select('id')
        .eq('user_id', user.id)
        .eq('phrase_card_id', phrase.id)
        .maybeSingle()
      if (alive) setIsSaved(!!data)
    })
    return () => { alive = false }
  }, [phrase.id])

  useEffect(() => {
    const handler = () => {
      const saved = localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY) as DisplayLocale | null
      if (saved) setDisplayLocale(saved)
    }
    window.addEventListener(DISPLAY_LOCALE_EVENT_NAME, handler)
    return () => window.removeEventListener(DISPLAY_LOCALE_EVENT_NAME, handler)
  }, [])

  const handleSave = async (e: ReactMouseEvent) => {
    e.stopPropagation()
    if (!userId) { setShowModal(true); return }
    if (isSaved) {
      await supabase.from('saved_phrase_cards')
        .delete()
        .eq('user_id', userId)
        .eq('phrase_card_id', phrase.id)
      setIsSaved(false)
    } else {
      await supabase.from('saved_phrase_cards')
        .insert({ user_id: userId, phrase_card_id: phrase.id })
      setIsSaved(true)
    }
  }

  const playAudio = async () => {
    if (audioUrl) { new Audio(audioUrl).play(); return }
    setAudioLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_CLOUDRUN_API_URL}/audio/phrase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase_card_id: phrase.id }),
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
        body: JSON.stringify({ phrase_card_id: phrase.id }),
      })
      const data = await res.json()
      if (data.ok && data.audioUrl) { setHeadwordAudioUrl(data.audioUrl); new Audio(data.audioUrl).play() }
    } catch { /* silent */ } finally { setHeadwordAudioLoading(false) }
  }

  const primary = phrase.senses?.[0]
  const meaning = displayLocale === 'ja'
    ? (primary?.meaning_ja ?? phrase.meaning_ja ?? phrase.meaning_en ?? '')
    : (primary?.meaning_en ?? phrase.meaning_en ?? phrase.meaning_ja ?? '')
  const example = primary?.example_en ?? phrase.example_en
  const exampleJa = primary?.example_ja ?? phrase.example_ja

  const typeLabel = pickLabel(TYPE_LABEL, phrase.type, displayLocale)
  const registerLabel = phrase.register && phrase.register !== 'neutral'
    ? pickLabel(REGISTER_LABEL, phrase.register, displayLocale)
    : null
  const localeLabel = pickLabel(LOCALE_LABEL, phrase.locale, displayLocale)
  const href = `/word/${cleanPhrase(phrase.phrase).replace(/\s+/g, '_')}`

  return (
    <div className="not-prose my-6">
      {showModal && <SignupRequiredModal onClose={() => setShowModal(false)} />}
      <CardShell onClick={() => router.push(href)}>
        {/* HEADER */}
        <div className="flex items-center justify-between py-1 px-1 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-2xl font-semibold leading-8 text-black">{cleanPhrase(phrase.phrase)}</h2>
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
            onClick={handleSave}
            className="p-2 -mr-2 -mt-1 shrink-0"
            aria-label={isSaved ? '保存済み' : '保存'}
          >
            {isSaved
              ? <HiBookmark className="size-6 text-muted" />
              : <HiOutlineBookmark className="size-6 text-primary" />
            }
          </button>
        </div>

        {/* メタ */}
        {(typeLabel || localeLabel || registerLabel) && (
          <div className="flex flex-wrap items-center gap-2 px-1 mb-2">
            {typeLabel && (
              <span className="text-xs text-muted border border-line rounded px-2 py-1">{typeLabel}</span>
            )}
            {localeLabel && (
              <span className="text-xs text-muted border border-line rounded px-2 py-1">{localeLabel}</span>
            )}
            {registerLabel && (
              <span className="text-xs text-muted border border-line rounded px-2 py-1">{registerLabel}</span>
            )}
          </div>
        )}

        {/* 意味 */}
        {meaning && (
          <div className="px-1">
            <p className="text-base font-medium text-black">{meaning}</p>
          </div>
        )}

        {/* 例文 */}
        <div className="px-1">
          <SenseExample
            example={example}
            translation={exampleJa}
            displayLocale={displayLocale}
            onPlay={playAudio}
            isLoading={audioLoading}
          />
        </div>
      </CardShell>
    </div>
  )
}
