'use client'

import { useState } from 'react'
import { POS_LABEL_JA } from '@/lib/pos'
import type { LexicalUnit, SimpleLexicalUnit } from '@/types/LexicalUnit'
import type { EtymologyData, LocalizedEtymologyJa } from '@/types/Etymology'
import type { DisplayLocale } from '@/types/DisplayLocale'
import CardShell from '@/components/CardShell'
import CardHeader from '@/components/CardHeader'
import SenseRow from '@/components/SenseRow'
import SenseExample from '@/components/SenseExample'
import EtymologyBlock from '@/components/EtymologyBlock'
import { useTtsAudio, playAudioAtRate, fetchTtsAudioUrl } from '@/lib/useTtsAudio'
import { useWordDetail } from '@/lib/wordDetailStack'

type Pronunciation = {
  phoneticSpelling?: string
  audioFile?: string
}

type SenseItem = {
  senseId: string
  meaning: string
  example?: string
  exampleTranslation?: string
}

type Props = {
  headword: string
  pronunciation: Pronunciation
  etymology: string
  etymologyData?: EtymologyData | null
  localizedEtymologyJa?: LocalizedEtymologyJa | null
  senses: Record<string, SenseItem[]>
  lexicalUnits?: Array<LexicalUnit | SimpleLexicalUnit>
  inflections?: string[]
  synonyms?: string[]
  derivatives?: string[]
  derivativesLabel?: string
  antonyms?: string[]
  grammarTags?: Record<string, string[]>
  isBookmarked: boolean
  onSave: (e?: React.MouseEvent) => void
  onShare?: (e?: React.MouseEvent) => void
  shareBtnRef?: React.Ref<HTMLButtonElement>
  pinnedSenseId?: string | null
  onTogglePin?: (senseId: string) => void
  displayLocale?: DisplayLocale
  compact?: boolean
  noCard?: boolean
}

const POS_LABEL_EN: Record<string, string> = {
  noun: 'noun', verb: 'verb', adjective: 'adjective', adverb: 'adverb',
  pronoun: 'pronoun', preposition: 'preposition', adposition: 'preposition', conjunction: 'conjunction',
  determiner: 'determiner', interjection: 'interjection',
  idiom: 'Idiom', phrasal_verb: 'Phrasal verb', fixed_expression: 'Fixed expression',
  spoken_expression: 'Spoken expression', collocation: 'Collocation',
  pattern: 'Pattern', expression: 'Expression', slang: 'Slang',
}

function getPosLabel(pos: string, locale: DisplayLocale): string {
  return locale === 'ja' ? (POS_LABEL_JA[pos] ?? pos) : (POS_LABEL_EN[pos] ?? pos)
}

export default function EntryCard({
  headword,
  pronunciation,
  etymology,
  etymologyData,
  localizedEtymologyJa,
  senses = {},
  inflections = [],
  synonyms = [],
  antonyms = [],
  derivatives = [],
  derivativesLabel,
  grammarTags = {},
  isBookmarked,
  pinnedSenseId = null,
  displayLocale = 'en',
  onTogglePin = () => {},
  onSave,
  onShare,
  shareBtnRef,
  compact = false,
  noCard = false,
}: Props) {
  // 見出し音声: Oxford 実録音があればそれを初期URLに、なければ TTS フォールバック
  const headwordAudio = useTtsAudio({
    endpoint: '/audio',
    body: { word: headword },
    initialUrl: pronunciation.audioFile ?? null,
  })

  const wordDetail = useWordDetail()
  const [navigatingDerivative, setNavigatingDerivative] = useState<string | null>(null)

  const [exampleAudioUrls, setExampleAudioUrls] = useState<Record<string, string>>({})
  const [exampleAudioLoading, setExampleAudioLoading] = useState<Record<string, boolean>>({})

  const handleDerivativeClick = async (d: string, e: React.MouseEvent) => {
    if (!wordDetail) return
    e.preventDefault()
    if (navigatingDerivative) return
    setNavigatingDerivative(d)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_CLOUDRUN_API_URL}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: d }),
      })
      if (!res.ok) return
      const data = await res.json()
      if (!data?.ok) return
      wordDetail.open({
        word: typeof data.resolved === 'string' ? data.resolved : d,
        dictionary: data.dictionary ?? data.raw ?? null,
        pinned_sense_id: null,
      })
    } finally {
      setNavigatingDerivative(null)
    }
  }

  const playAudio = async () => {
    await headwordAudio.play()
  }

  const playExampleAudio = async (senseId: string) => {
    const cached = exampleAudioUrls[senseId]
    if (cached) { playAudioAtRate(cached, 1.2); return }
    setExampleAudioLoading(prev => ({ ...prev, [senseId]: true }))
    const url = await fetchTtsAudioUrl('/audio/word/example', { word: headword, sense_id: senseId })
    if (url) {
      setExampleAudioUrls(prev => ({ ...prev, [senseId]: url }))
      playAudioAtRate(url, 1.2)
    }
    setExampleAudioLoading(prev => ({ ...prev, [senseId]: false }))
  }

  const labels = displayLocale === 'ja'
    ? { synonyms: '類義語', antonyms: '対義語', derivatives: '派生語', pinThisSense: 'この意味をピン留め', saveToList: 'マイリストに追加', removeFromList: 'マイリストから外す' }
    : { synonyms: 'Synonyms', antonyms: 'Antonyms', derivatives: 'Derivatives', pinThisSense: 'Pin this sense', saveToList: 'Add to My List', removeFromList: 'Remove from list' }

  const orderedDerivatives = [...new Set(derivatives)].sort((a, b) => {
    const score = (v: string) => v.endsWith('ing') ? 3 : v.endsWith('ed') ? 2 : v.endsWith('s') ? 1 : 0
    return score(a) - score(b)
  })

  return (
    <CardShell noCard={noCard}>

        {/* ── HEADER ── */}
        <CardHeader
          title={headword}
          audioLoading={headwordAudio.loading}
          onPlayAudio={playAudio}
          isSaved={isBookmarked}
          onSave={onSave}
          onShare={onShare}
          shareBtnRef={shareBtnRef}
          saveTooltip={{ saved: labels.removeFromList, unsaved: labels.saveToList }}
          headingLevel="h1"
          tutorialAttr
        />

        {/* IPA */}
        {pronunciation?.phoneticSpelling && (
          <div className="flex items-center">
            <span className="text-base font-medium text-muted">
              /{pronunciation.phoneticSpelling}/
            </span>
          </div>
        )}

        {/* ── ETYMOLOGY HOOK ── */}
        {!compact && (
          <EtymologyBlock
            headword={headword}
            etymologyData={etymologyData}
            localizedEtymologyJa={localizedEtymologyJa}
            etymology={etymology}
            displayLocale={displayLocale}
          />
        )}

        {/* ── SENSES ── */}
        <div className="mt-2 flex flex-col gap-4">
          {(() => {
            const allEntries = Object.entries(senses).filter(([, items]) => items.length > 0)

            if (compact) {
              const pinnedEntry = allEntries.find(([, items]) =>
                items.some(s => s.senseId === pinnedSenseId)
              ) ?? allEntries[0]
              if (!pinnedEntry) return null

              const [pos, items] = pinnedEntry
              const sense = items.find(s => s.senseId === pinnedSenseId) ?? items[0]
              if (!sense) return null

              return [(
                <div key={pos}>
                  <span className="inline-flex items-center border border-muted rounded-full px-2 py-1 text-xs font-medium text-muted">
                    {getPosLabel(pos, displayLocale)}
                  </span>
                  <p className="mt-2 text-base font-medium text-black">{sense.meaning}</p>
                  <SenseExample
                    example={sense.example}
                    translation={sense.exampleTranslation}
                    displayLocale={displayLocale}
                    onPlay={() => playExampleAudio(sense.senseId)}
                    isLoading={!!exampleAudioLoading[sense.senseId]}
                  />
                </div>
              )]
            }

            return allEntries.map(([pos, items]) => (
              <div key={pos}>
                <span className="inline-flex items-center border border-muted rounded-full px-2 py-1 text-xs font-medium text-muted">
                  {getPosLabel(pos, displayLocale)}
                </span>

                {pos === 'verb' && inflections.length > 0 && (
                  <p className="mt-1 text-sm text-muted">{inflections.join(' · ')}</p>
                )}

                <div className="mt-2 flex flex-col gap-6">
                  {(items.some((s) => !!s.example) ? items.filter((s) => !!s.example) : items).map((sense) => (
                    <SenseRow
                      key={sense.senseId}
                      meaning={sense.meaning}
                      example={sense.example}
                      translation={sense.exampleTranslation}
                      displayLocale={displayLocale}
                      onPlayExample={() => playExampleAudio(sense.senseId)}
                      exampleLoading={!!exampleAudioLoading[sense.senseId]}
                      grammarTags={grammarTags[sense.senseId]}
                      showPinButton
                      isPinned={pinnedSenseId === sense.senseId}
                      onTogglePin={() => onTogglePin(sense.senseId)}
                      tutorialPinAttr
                    />
                  ))}
                </div>
              </div>
            ))
          })()}
        </div>

        {/* ── SYNONYMS / ANTONYMS ── */}
        {synonyms.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-muted mb-1">{labels.synonyms}</p>
            <p className="text-sm text-black">{synonyms.slice(0, 8).join(', ')}</p>
          </div>
        )}
        {antonyms.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-muted mb-1">{labels.antonyms}</p>
            <p className="text-sm text-black">{antonyms.slice(0, 8).join(', ')}</p>
          </div>
        )}

        {/* ── DERIVATIVES ── */}
        {orderedDerivatives.length > 0 && (
          <div className="mt-3">
            {(derivativesLabel ?? labels.derivatives) && (
              <p className="text-xs text-muted mb-1.5">{derivativesLabel ?? labels.derivatives}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {orderedDerivatives.map(d => (
                <a
                  key={d}
                  href={`/word/${encodeURIComponent(d)}`}
                  onClick={e => handleDerivativeClick(d, e)}
                  className={`text-sm text-primary underline underline-offset-2 hover:text-primary-hover ${navigatingDerivative === d ? 'opacity-50' : ''}`}
                >
                  {d}
                </a>
              ))}
            </div>
          </div>
        )}
    </CardShell>
  )
}
