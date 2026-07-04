'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { DISPLAY_LOCALE_STORAGE_KEY, DISPLAY_LOCALE_EVENT_NAME } from '@/types/DisplayLocale'
import type { DisplayLocale } from '@/types/DisplayLocale'
import EntryCard from '@/components/EntryCard'
import SignupRequiredModal from '@/components/SignupRequiredModal'

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

  const senseItems = []
  if (meaning) {
    senseItems.push({
      senseId: '1',
      meaning,
      example: card.example ?? undefined,
      exampleTranslation: (card.example_ja && displayLocale === 'ja') ? card.example_ja : undefined,
    })
  }
  if (explanation) {
    senseItems.push({
      senseId: '2',
      meaning: explanation,
    })
  }

  const posKey = card.type ?? 'expression'
  const senses = senseItems.length > 0 ? { [posKey]: senseItems } : {}
  const componentWords = getComponentWords(card.phrase)

  return (
    <div className="bg-surface min-h-screen">
      {showSignupModal && <SignupRequiredModal onClose={() => setShowSignupModal(false)} />}
      <EntryCard
        headword={cleanPhrase(card.phrase)}
        pronunciation={{}}
        etymology=""
        senses={senses}
        derivatives={componentWords}
        derivativesLabel=""
        isBookmarked={isSaved}
        onSave={handleSave}
        displayLocale={displayLocale}
      />
    </div>
  )
}
