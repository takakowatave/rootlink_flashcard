'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { HiBookmark, HiOutlineBookmark, HiSpeakerWave } from 'react-icons/hi2'
import toast from 'react-hot-toast'
import CardShell from '@/components/CardShell'
import EtymologyBlock from '@/components/EtymologyBlock'
import SenseExample from '@/components/SenseExample'
import SignupRequiredModal from '@/components/SignupRequiredModal'
import { supabase } from '@/lib/supabaseClient'
import { toggleSaveStatus } from '@/lib/supabaseApi'
import { useTtsAudio, playAudioAtRate, fetchTtsAudioUrl } from '@/lib/useTtsAudio'
import { sendEvent } from '@/lib/ga'
import { POS_LABEL_JA } from '@/lib/pos'
import { readLocalizedEtymologyJa } from '@/lib/etymologyDisplay'
import type { SavedWordDictionary } from '@/types/Dictionary'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

type Props = {
  word: string
  dictionary: SavedWordDictionary | null
  senseIndex?: number
}

// senseGroups をフラット化し、1-based の N 番目 sense を返す。
// N 未指定・範囲外は先頭 sense にフォールバック。
type FlatSense = {
  pos: string
  senseId: string
  meaningEn: string
  meaningJa?: string
  exampleEn?: string
  exampleJa?: string
}

function pickSense(
  dictionary: SavedWordDictionary | null,
  senseIndex: number | undefined
): FlatSense | null {
  if (!dictionary) return null
  const groups = Array.isArray(dictionary.senseGroups) ? dictionary.senseGroups : []
  const jaMap = dictionary.locales?.ja?.senses ?? {}
  const flat: FlatSense[] = []
  for (const g of groups) {
    const pos = String(g.partOfSpeech ?? '').toLowerCase()
    if (!pos) continue
    for (const s of g.senses ?? []) {
      const senseId = String(s.senseId ?? '')
      const meaningEn =
        typeof s.definition === 'string'
          ? s.definition
          : String((s.definition as { en?: string } | undefined)?.en ?? '')
      if (!senseId || !meaningEn) continue
      const example =
        typeof s.example === 'string'
          ? { en: s.example, ja: undefined as string | undefined }
          : {
              en: (s.example as { en?: string } | undefined)?.en,
              ja: (s.example as { ja?: string } | undefined)?.ja,
            }
      const jaLocale = jaMap[senseId]
      flat.push({
        pos,
        senseId,
        meaningEn,
        meaningJa: jaLocale?.meaning ?? undefined,
        exampleEn: example.en,
        exampleJa: example.ja ?? jaLocale?.exampleTranslation ?? undefined,
      })
    }
  }
  if (flat.length === 0) return null
  const idx = senseIndex && senseIndex >= 1 && senseIndex <= flat.length ? senseIndex - 1 : 0
  return flat[idx]
}

function posLabel(pos: string): string {
  return POS_LABEL_JA[pos] ?? pos
}

export default function WordCardEmbed({ word, dictionary, senseIndex }: Props) {
  const [userId, setUserId] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)

  // 音声（見出し語）— Oxford の実録音があればそれ、なければ TTS
  const headwordAudioInitial = dictionary?.audio?.audioUrl
    ?? (dictionary?.audio?.audioPath ? `${SUPABASE_URL}/storage/v1/object/public/${dictionary.audio.audioPath}` : null)
  const headwordAudio = useTtsAudio({
    endpoint: '/audio',
    body: { word },
    initialUrl: headwordAudioInitial,
  })

  const [exampleAudioUrl, setExampleAudioUrl] = useState<string | null>(null)
  const [exampleAudioLoading, setExampleAudioLoading] = useState(false)

  const sense = useMemo(() => pickSense(dictionary, senseIndex), [dictionary, senseIndex])

  const localizedEtymologyJa = useMemo(
    () => readLocalizedEtymologyJa(dictionary ?? {}),
    [dictionary]
  )

  useEffect(() => {
    let alive = true
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!alive) return
      if (!user) return
      setUserId(user.id)
      const { data: existingWord } = await supabase
        .from('words')
        .select('id')
        .eq('word', word)
        .maybeSingle()
      if (!existingWord || !alive) return
      const { data: saved } = await supabase
        .from('saved_words')
        .select('id')
        .eq('user_id', user.id)
        .eq('word_id', existingWord.id)
        .maybeSingle()
      if (alive) setIsSaved(!!saved)
    })
    return () => { alive = false }
  }, [word])

  const handleBookmark = async () => {
    sendEvent('word_card_save', { word, logged_in: userId ? 'yes' : 'no' })
    if (!userId) {
      setShowSignupModal(true)
      return
    }
    if (!dictionary) return
    const prev = isSaved
    setIsSaved(!prev)
    const result = await toggleSaveStatus({ word, dictionary } as Parameters<typeof toggleSaveStatus>[0])
    if (!result.success) {
      setIsSaved(prev)
      if (result.limitReached) {
        toast.error('保存上限に達しました', { position: 'top-center' })
      }
    } else if (!prev) {
      toast.success('単語を保存しました！', { position: 'top-center' })
    }
  }

  const handleHeadwordClick = () => {
    sendEvent('word_card_open', { word })
  }

  const playHeadwordAudio = async () => {
    sendEvent('word_card_audio_play', { word, kind: 'headword' })
    await headwordAudio.play()
  }

  const playExampleAudio = async () => {
    if (!sense) return
    sendEvent('word_card_audio_play', { word, kind: 'example' })
    if (exampleAudioUrl) {
      playAudioAtRate(exampleAudioUrl, 1.2)
      return
    }
    setExampleAudioLoading(true)
    const url = await fetchTtsAudioUrl('/audio/word/example', { word, sense_id: sense.senseId })
    if (url) {
      setExampleAudioUrl(url)
      playAudioAtRate(url, 1.2)
    }
    setExampleAudioLoading(false)
  }

  const headwordHref = `/word/${encodeURIComponent(word)}`

  // 未 cache: プレースホルダ（見出し語のみリンク）
  if (!dictionary) {
    return (
      <div className="not-prose my-6">
        <CardShell>
          <div className="py-2">
            <Link
              href={headwordHref}
              onClick={handleHeadwordClick}
              className="text-2xl font-semibold text-primary hover:underline"
            >
              {word}
            </Link>
            <p className="mt-1 text-xs text-muted">
              この単語の詳細ページを開く
            </p>
          </div>
        </CardShell>
      </div>
    )
  }

  return (
    <div className="not-prose my-6">
      {showSignupModal && (
        <SignupRequiredModal
          trigger="word_card_bookmark"
          onClose={() => setShowSignupModal(false)}
        />
      )}
      <CardShell>
        {/* ── HEADER: 見出し語（リンク）＋ 音声 ＋ ブックマーク ── */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href={headwordHref}
              onClick={handleHeadwordClick}
              className="text-2xl font-semibold leading-8 text-black hover:underline"
            >
              {word}
            </Link>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); playHeadwordAudio() }}
              disabled={headwordAudio.loading}
              className="shrink-0"
              aria-label="発音を再生"
            >
              <HiSpeakerWave className={`size-6 ${headwordAudio.loading ? 'text-muted animate-pulse' : 'text-muted'}`} />
            </button>
          </div>
          <button
            type="button"
            onClick={handleBookmark}
            aria-label={isSaved ? '保存済み' : '保存'}
            className="p-2 -mr-2 -mt-1 shrink-0"
          >
            {isSaved
              ? <HiBookmark className="size-6 text-muted" />
              : <HiOutlineBookmark className="size-6 text-primary" />}
          </button>
        </div>

        {/* IPA */}
        {dictionary.ipa && (
          <div className="flex items-center">
            <span className="text-base font-medium text-muted">/{dictionary.ipa}/</span>
          </div>
        )}

        {/* 語根チップ + 語源解説 */}
        <EtymologyBlock
          headword={word}
          etymologyData={dictionary.etymologyData ?? null}
          localizedEtymologyJa={localizedEtymologyJa}
          etymology={typeof dictionary.etymology === 'string' ? dictionary.etymology : ''}
          displayLocale="ja"
          withTutorialAttr={false}
        />

        {/* Sense（1件のみ） */}
        {sense && (
          <div className="mt-2">
            <span className="inline-flex items-center border border-muted rounded-full px-2 py-1 text-xs font-medium text-muted">
              {posLabel(sense.pos)}
            </span>
            <p className="mt-2 text-base font-medium text-black">
              {sense.meaningJa || sense.meaningEn}
            </p>
            {(sense.exampleEn || sense.exampleJa) && (
              <SenseExample
                example={sense.exampleEn}
                translation={sense.exampleJa}
                displayLocale="ja"
                onPlay={playExampleAudio}
                isLoading={exampleAudioLoading}
              />
            )}
          </div>
        )}
      </CardShell>
    </div>
  )
}
