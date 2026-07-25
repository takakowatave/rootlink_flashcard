'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import PhraseCard, { type PhraseCardData } from '@/components/PhraseCard'
import SignupRequiredModal from '@/components/SignupRequiredModal'

export type EmbeddedPhrase = PhraseCardData

function cleanPhrase(phrase: string): string {
  return phrase.replace(/\s*\([^)]*\)\s*$/, '').trim()
}

export default function PhraseCardEmbed({ phrase }: { phrase: EmbeddedPhrase }) {
  const router = useRouter()
  const [isSaved, setIsSaved] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

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

  const playAudio = async () => {
    const play = (url: string) => {
      const a = new Audio(url)
      a.playbackRate = 1.2
      a.play()
    }
    if (audioUrl) { play(audioUrl); return }
    setAudioLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_CLOUDRUN_API_URL}/audio/phrase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase_card_id: phrase.id }),
      })
      const data = await res.json()
      if (data.ok && data.audioUrl) { setAudioUrl(data.audioUrl); play(data.audioUrl) }
    } catch { /* silent */ } finally { setAudioLoading(false) }
  }

  const playHeadwordAudio = async () => {
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

  const href = `/word/${cleanPhrase(phrase.phrase).replace(/\s+/g, '_')}`

  return (
    <div className="not-prose my-6">
      {showModal && <SignupRequiredModal onClose={() => setShowModal(false)} />}
      <PhraseCard
        card={phrase}
        isSaved={isSaved}
        onSave={handleSave}
        onClick={() => router.push(href)}
        onPlayHeadword={playHeadwordAudio}
        headwordAudioLoading={headwordAudioLoading}
        onPlayExample={playAudio}
        exampleAudioLoading={audioLoading}
      />
    </div>
  )
}
