'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import PhraseCard, { type PhraseCardData } from '@/components/PhraseCard'
import SignupRequiredModal from '@/components/SignupRequiredModal'
import { useTtsAudio } from '@/lib/useTtsAudio'

export type EmbeddedPhrase = PhraseCardData

function cleanPhrase(phrase: string): string {
  return phrase.replace(/\s*\([^)]*\)\s*$/, '').trim()
}

export default function PhraseCardEmbed({ phrase }: { phrase: EmbeddedPhrase }) {
  const router = useRouter()
  const [isSaved, setIsSaved] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const example = useTtsAudio({
    endpoint: '/audio/phrase',
    body: { phrase_card_id: phrase.id },
    playbackRate: 1.2,
  })
  const headword = useTtsAudio({
    endpoint: '/audio/phrase/headword',
    body: { phrase_card_id: phrase.id },
  })

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

  const href = `/word/${cleanPhrase(phrase.phrase).replace(/\s+/g, '_')}`

  return (
    <div className="not-prose my-6">
      {showModal && <SignupRequiredModal onClose={() => setShowModal(false)} />}
      <PhraseCard
        card={phrase}
        isSaved={isSaved}
        onSave={handleSave}
        onClick={() => router.push(href)}
        onPlayHeadword={headword.play}
        headwordAudioLoading={headword.loading}
        onPlayExample={example.play}
        exampleAudioLoading={example.loading}
      />
    </div>
  )
}
