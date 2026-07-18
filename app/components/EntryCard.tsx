'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { HiSpeakerWave, HiBookmark, HiOutlineBookmark } from 'react-icons/hi2'
import { MdRemoveCircle, MdAddCircle } from 'react-icons/md'
import { BsPinFill } from 'react-icons/bs'
import { POS_LABEL_JA } from '@/lib/pos'
import type { LexicalUnit, SimpleLexicalUnit } from '@/types/LexicalUnit'
import type { EtymologyData, LocalizedEtymologyJa } from '@/types/Etymology'
import type { DisplayLocale } from '@/types/DisplayLocale'
import CardShell from '@/components/CardShell'
import SenseRow from '@/components/SenseRow'
import SenseExample from '@/components/SenseExample'
import { supabase } from '@/lib/supabaseClient'

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
  compact = false,
  noCard = false,
}: Props) {
  const parts = useMemo(
    () => etymologyData?.structure.type === 'parts'
      ? etymologyData.structure.parts.filter(p => p.text || p.meaning)
      : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [etymologyData]
  )

  const router = useRouter()
  const [navigatingWord, setNavigatingWord] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioLoading, setAudioLoading] = useState(false)
  const [exampleAudioUrls, setExampleAudioUrls] = useState<Record<string, string>>({})
  const [exampleAudioLoading, setExampleAudioLoading] = useState<Record<string, boolean>>({})
  const [expandedParts, setExpandedParts] = useState<boolean[]>(() => parts.map(() => false))
  const [partWordMap, setPartWordMap] = useState<Record<string, string[]>>({})

  useEffect(() => {
    if (parts.length === 0) return
    parts.forEach(part => {
      if (!part?.text) return
      const partText = part.text.toLowerCase()
      supabase
        .from('etymology_part_words')
        .select('word')
        .eq('part_text', partText)
        .neq('word', headword.toLowerCase())
        .limit(8)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setPartWordMap(prev => ({ ...prev, [partText]: data.map(d => d.word) }))
          }
        })
    })
  }, [parts, headword])

  const playAudio = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (audioUrl) { new Audio(audioUrl).play(); return }
    setAudioLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_CLOUDRUN_API_URL}/audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: headword }),
      })
      const data = await res.json()
      if (data.ok && data.audioUrl) { setAudioUrl(data.audioUrl); new Audio(data.audioUrl).play() }
    } catch { /* silent */ } finally { setAudioLoading(false) }
  }

  const playExampleAudio = async (senseId: string) => {
    const cached = exampleAudioUrls[senseId]
    if (cached) { new Audio(cached).play(); return }
    setExampleAudioLoading(prev => ({ ...prev, [senseId]: true }))
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_CLOUDRUN_API_URL}/audio/word/example`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: headword, sense_id: senseId }),
      })
      const data = await res.json()
      if (data.ok && data.audioUrl) {
        setExampleAudioUrls(prev => ({ ...prev, [senseId]: data.audioUrl }))
        new Audio(data.audioUrl).play()
      }
    } catch { /* silent */ } finally {
      setExampleAudioLoading(prev => ({ ...prev, [senseId]: false }))
    }
  }

  const labels = displayLocale === 'ja'
    ? { synonyms: '類義語', antonyms: '対義語', derivatives: '派生語', pinThisSense: 'この意味をピン留め', saveToList: 'マイリストに追加', removeFromList: 'マイリストから外す' }
    : { synonyms: 'Synonyms', antonyms: 'Antonyms', derivatives: 'Derivatives', pinThisSense: 'Pin this sense', saveToList: 'Add to My List', removeFromList: 'Remove from list' }

  const hasParts = parts.length > 0

  const displayedEtymologyDescription = displayLocale === 'ja'
    ? localizedEtymologyJa?.description ?? etymology
    : etymology

  // 「〜から来ています。」系の冗長テキストは非表示（パーツがある場合は語源パーツで伝わる）
  const isRedundantDescription = (text: string) =>
    /から来てい(ます|る)[。．]?\s*$/.test(text.trim()) ||
    /^.{0,30}から来てい(ます|る)[。．]?\s*$/.test(text.trim())

  const hasEtymologyText = Boolean(
    displayedEtymologyDescription?.trim() &&
    !isRedundantDescription(displayedEtymologyDescription)
  )

  const orderedDerivatives = [...new Set(derivatives)].sort((a, b) => {
    const score = (v: string) => v.endsWith('ing') ? 3 : v.endsWith('ed') ? 2 : v.endsWith('s') ? 1 : 0
    return score(a) - score(b)
  })

  return (
    <CardShell noCard={noCard}>

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold leading-8 text-black">{headword}</h1>
            <button type="button" onClick={playAudio} disabled={audioLoading} className="shrink-0">
              <HiSpeakerWave className={`size-6 ${audioLoading ? 'text-muted animate-pulse' : 'text-muted'}`} />
            </button>
          </div>
          <div className="group/save relative shrink-0">
            <button type="button" onClick={onSave} data-tutorial="save-button" className="p-2 -mr-2 -mt-1">
              {isBookmarked
                ? <HiBookmark className="size-6 text-muted" />
                : <HiOutlineBookmark className="size-6 text-primary" />
              }
            </button>
            <span className="pointer-events-none absolute top-full right-0 z-20 mt-2 whitespace-nowrap rounded-lg bg-gray-700 px-3 py-2 text-xs text-white opacity-0 shadow-md transition-opacity group-hover/save:opacity-100">
              {isBookmarked
                ? labels.removeFromList
                : labels.saveToList}
            </span>
          </div>
        </div>

        {/* IPA */}
        {pronunciation?.phoneticSpelling && (
          <div className="flex items-center">
            <span className="text-base font-medium text-muted">
              /{pronunciation.phoneticSpelling}/
            </span>
          </div>
        )}

        {/* ── ETYMOLOGY HOOK ── */}
        {!compact && hasParts && (
          <div data-tutorial="etymology-tree" className="mt-2 bg-primary-subtle rounded-sm px-2 py-2 flex flex-col gap-[16px] overflow-x-hidden">
            {/* Root panels — side-by-side */}
            <div className="flex flex-wrap gap-2 items-start w-full overflow-x-hidden">
            {parts.map((part, idx) => {
              const gloss = displayLocale === 'ja'
                ? (part.meaningJa ?? part.meaning ?? '')
                : (part.meaning ?? part.meaningJa ?? '')

              const filteredWords = (partWordMap[part.text.toLowerCase()] ?? []).slice(0, 6)

              return (
                <div
                  key={idx}
                  className={`bg-primary-light rounded-lg min-w-0 flex flex-col gap-2 basis-[calc(50%-4px)] max-w-[calc(50%-4px)] ${filteredWords.length > 0 ? 'p-2' : 'px-3.5 py-2'}`}
                >
                  {/* Badge + gloss */}
                  <div className="flex items-start gap-2">
                    <div className="flex h-[28px] items-center shrink-0">
                      {filteredWords.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setExpandedParts(prev => prev.map((v, i) => i === idx ? !v : v))}
                          className="bg-white border-2 border-primary-mid rounded-[24px] pl-[4px] pr-[12px] py-[4px] flex items-center gap-[4px]"
                        >
                          {expandedParts[idx]
                            ? <MdRemoveCircle className="size-5 text-primary-dark" />
                            : <MdAddCircle    className="size-5 text-primary-dark" />
                          }
                          <span className="text-base font-medium text-primary-dark leading-4">{part.text}</span>
                        </button>
                      ) : (
                        <div className="bg-white border-2 border-primary-mid rounded-[24px] px-[12px] py-[4px]">
                          <span className="text-base font-medium text-primary-dark leading-4">{part.text}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-primary-dark leading-[28px]">{gloss}</span>
                  </div>

                  {/* Related words tree */}
                  {expandedParts[idx] && filteredWords.length > 0 && (() => {
                    const ITEM_H = 36
                    const TX = 5
                    const R = 10
                    const lastMidY = (filteredWords.length - 1) * ITEM_H + ITEM_H / 2
                    const trunkEnd = lastMidY - R
                    return (
                      <div className="relative ml-1 overflow-x-hidden" style={{ paddingLeft: 40 }}>
                        <svg
                          className="absolute left-0 top-0 pointer-events-none overflow-visible"
                          width={36}
                          height={filteredWords.length * ITEM_H}
                          fill="none"
                        >
                          <path
                            d={`M ${TX},0 L ${TX},${trunkEnd}`}
                            stroke="#00AD82"
                            strokeWidth="2"
                            strokeLinecap="round"
                            pathLength="1"
                            strokeDasharray="1"
                            strokeDashoffset="1"
                            style={{ animation: 'draw-path 0.4s ease forwards' }}
                          />
                          {filteredWords.map((_, wi) => {
                            const midY = wi * ITEM_H + ITEM_H / 2
                            return (
                              <path
                                key={wi}
                                d={`M ${TX},${midY - R} C ${TX},${midY} ${TX + R},${midY} ${TX + R + 2},${midY} L 34,${midY}`}
                                stroke="#00AD82"
                                strokeWidth="2"
                                strokeLinecap="round"
                                fill="none"
                                pathLength="1"
                                strokeDasharray="1"
                                strokeDashoffset="1"
                                style={{ animation: `draw-path 0.35s ease ${0.12 + wi * 0.12}s forwards` }}
                              />
                            )
                          })}
                        </svg>
                        {filteredWords.map((rw, wi) => (
                          <div key={wi} className="flex items-center gap-[2px]" style={{ height: ITEM_H }}>
                            <div className="group/chip relative shrink-0">
                              <button
                                type="button"
                                disabled={navigatingWord !== null}
                                onClick={async () => {
                                  setNavigatingWord(rw)
                                  try {
                                    const res = await fetch(`${process.env.NEXT_PUBLIC_CLOUDRUN_API_URL}/resolve`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ query: rw }),
                                    })
                                    if (!res.ok) return
                                    const data = await res.json()
                                    if (data?.ok && typeof data.redirectTo === 'string') {
                                      router.push(data.redirectTo)
                                    }
                                  } finally {
                                    setNavigatingWord(null)
                                  }
                                }}
                                className="bg-primary-subtle px-[8px] py-[4px] rounded-[24px] transition-opacity disabled:opacity-50"
                              >
                                {navigatingWord === rw ? (
                                  <svg className="size-4 animate-spin text-secondary" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                  </svg>
                                ) : (
                                  <span className="text-[14px] font-medium text-secondary leading-4">{rw}</span>
                                )}
                              </button>
                              <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-700 px-3 py-2 text-xs text-white opacity-0 shadow-md transition-opacity group-hover/chip:opacity-100">
                                {displayLocale === 'ja' ? 'この単語を検索' : 'Search this word'}
                              </span>
                            </div>
                            {part.relatedWordMeanings?.[rw] && (
                              <span className="text-[12px] font-medium text-secondary w-[33px]">{part.relatedWordMeanings[rw]}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              )
            })}
            </div>

            {/* Etymology description */}
            {hasEtymologyText && (
              <p className="text-[14px] text-primary-dark leading-[20px]">{displayedEtymologyDescription}</p>
            )}
          </div>
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
                  <div className="mt-2 flex items-start gap-2">
                    <p className="flex-1 text-base font-medium text-black">{sense.meaning}</p>
                    <BsPinFill className="size-4 text-muted shrink-0 mt-1" />
                  </div>
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
                <a key={d} href={`/word/${encodeURIComponent(d)}`} className="text-sm text-primary underline underline-offset-2 hover:text-primary-hover">{d}</a>
              ))}
            </div>
          </div>
        )}
    </CardShell>
  )
}
