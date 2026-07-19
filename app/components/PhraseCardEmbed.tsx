'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { HiBookmark, HiOutlineBookmark } from 'react-icons/hi2'
import { supabase } from '@/lib/supabaseClient'
import SignupRequiredModal from '@/components/SignupRequiredModal'

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
  example_en: string | null
  example_ja: string | null
  senses: Sense[] | null
}

export default function PhraseCardEmbed({ phrase }: { phrase: EmbeddedPhrase }) {
  const [isSaved, setIsSaved] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

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

  const handleSave = async () => {
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

  const primary = phrase.senses?.[0]
  const meaning = primary?.meaning_ja ?? phrase.meaning_ja
  const example = primary?.example_en ?? phrase.example_en
  const exampleJa = primary?.example_ja ?? phrase.example_ja

  return (
    <div className="not-prose my-6 border border-line rounded-2xl bg-white px-5 py-4">
      {showModal && <SignupRequiredModal onClose={() => setShowModal(false)} />}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-gray-900">{phrase.phrase}</p>
          {meaning && <p className="text-sm text-gray-600 mt-1">{meaning}</p>}
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="shrink-0 p-1 -mr-1"
          aria-label={isSaved ? '保存済み' : '保存'}
        >
          {isSaved
            ? <HiBookmark className="size-6 text-muted" />
            : <HiOutlineBookmark className="size-6 text-primary" />
          }
        </button>
      </div>

      {example && (
        <div className="mt-3 pt-3 border-t border-line">
          <p className="text-sm text-gray-800 italic">{example}</p>
          {exampleJa && <p className="text-xs text-gray-500 mt-1">{exampleJa}</p>}
        </div>
      )}

      <Link
        href={`/phrases/${phrase.id}`}
        className="inline-flex items-center text-sm text-primary hover:underline mt-3"
      >
        詳しく見る →
      </Link>
    </div>
  )
}
