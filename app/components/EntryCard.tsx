'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HiSpeakerWave, HiBookmark } from 'react-icons/hi2'
import { MdRemoveCircle, MdAddCircle } from 'react-icons/md'
import { BsPin, BsPinFill } from 'react-icons/bs'
import { POS_LABEL_JA } from '@/lib/pos'
import type { LexicalUnit, SimpleLexicalUnit } from '@/types/LexicalUnit'
import type { EtymologyData, LocalizedEtymologyJa } from '@/types/Etymology'
import type { DisplayLocale } from '@/types/DisplayLocale'
import GrammarTags from '@/components/GrammarTags'

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
  antonyms?: string[]
  grammarTags?: Record<string, string[]>
  isBookmarked: boolean
  onSave: (e?: React.MouseEvent) => void
  pinnedSenseId?: string | null
  onTogglePin?: (senseId: string) => void
  displayLocale?: DisplayLocale
  compact?: boolean
}

const POS_LABEL_EN: Record<string, string> = {
  noun: 'noun', verb: 'verb', adjective: 'adjective', adverb: 'adverb',
  pronoun: 'pronoun', preposition: 'preposition', conjunction: 'conjunction',
  determiner: 'determiner', interjection: 'interjection',
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
  grammarTags = {},
  isBookmarked,
  pinnedSenseId = null,
  displayLocale = 'en',
  onTogglePin = () => {},
  onSave,
  compact = false,
}: Props) {
  const parts = etymologyData?.structure.type === 'parts'
    ? etymologyData.structure.parts.filter(p => p.text || p.meaning)
    : []

  const router = useRouter()
  const [navigatingWord, setNavigatingWord] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(pronunciation?.audioFile ?? null)
  const [audioLoading, setAudioLoading] = useState(false)
  const [expandedParts, setExpandedParts] = useState<boolean[]>(() => parts.map(() => true))

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

  const labels = displayLocale === 'ja'
    ? { synonyms: '類義語', antonyms: '対義語', derivatives: '派生語', pinThisSense: 'この意味をピン留め' }
    : { synonyms: 'Synonyms', antonyms: 'Antonyms', derivatives: 'Derivatives', pinThisSense: 'Pin this sense' }

  const displayedEtymologyDescription = displayLocale === 'ja'
    ? localizedEtymologyJa?.description ?? etymology
    : etymology

  const hasParts = parts.length > 0
  const hasEtymologyText = Boolean(displayedEtymologyDescription?.trim())

  const orderedDerivatives = [...new Set(derivatives)].sort((a, b) => {
    const score = (v: string) => v.endsWith('ing') ? 3 : v.endsWith('ed') ? 2 : v.endsWith('s') ? 1 : 0
    return score(a) - score(b)
  })

  return (
    <div className="mx-auto max-w-[600px] px-4 py-3">
      <div className="bg-white rounded-lg shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] pt-2 pb-3 px-2">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold leading-8 text-black">{headword}</h1>
            <button type="button" onClick={playAudio} disabled={audioLoading} className="shrink-0">
              <HiSpeakerWave className={`size-6 ${audioLoading ? 'text-[#90a1b9] animate-pulse' : 'text-[#90a1b9]'}`} />
            </button>
          </div>
          <button type="button" onClick={onSave} className="shrink-0">
            <HiBookmark className={`size-6 ${isBookmarked ? 'text-[#009689]' : 'text-[#90a1b9]'}`} />
          </button>
        </div>

        {/* IPA */}
        {pronunciation?.phoneticSpelling && (
          <div className="px-2 flex items-center">
            <span className="text-base font-medium text-[#90a1b9]">
              /{pronunciation.phoneticSpelling}/
            </span>
          </div>
        )}

        {/* ── ETYMOLOGY HOOK ── */}
        {!compact && hasParts && (
          <div className="mt-2 bg-[#f0fdfa] rounded-sm px-2 py-2 flex flex-col gap-2">
            {/* Root panels */}
            {parts.map((part, idx) => {
              const gloss = displayLocale === 'ja'
                ? (part.meaningJa ?? part.meaning ?? '')
                : (part.meaning ?? part.meaningJa ?? '')

              const filteredWords = [...new Set(
                part.relatedWords.filter(w =>
                  w.toLowerCase() !== headword.toLowerCase() &&
                  w.toLowerCase().startsWith(headword.toLowerCase())
                )
              )].slice(0, 3)

              const isFirst = idx === 0

              return (
                <div
                  key={idx}
                  className="bg-[#cbfbf1] rounded-lg px-3.5 py-2 flex flex-col gap-2"
                >
                  {/* Badge + gloss */}
                  <div className="flex items-center gap-2">
                    {isFirst ? (
                      <button
                        type="button"
                        onClick={() => setExpandedParts(prev => prev.map((v, i) => i === idx ? !v : v))}
                        className="bg-white border-2 border-[#00d5be] rounded-3xl pl-1 pr-3 py-1 flex items-center gap-1 shrink-0"
                      >
                        {expandedParts[idx]
                          ? <MdRemoveCircle className="size-5 text-[#00786f]" />
                          : <MdAddCircle    className="size-5 text-[#00786f]" />
                        }
                        <span className="text-base font-medium text-[#00786f] leading-4">{part.text}</span>
                      </button>
                    ) : (
                      <div className="bg-white border-2 border-[#00d5be] rounded-3xl px-3 py-1 shrink-0">
                        <span className="text-base font-medium text-[#00786f] leading-4">{part.text}</span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-[#00786f] whitespace-nowrap">{gloss}</span>
                  </div>

                  {/* Related words tree — first panel only */}
                  {isFirst && expandedParts[idx] && filteredWords.length > 0 && (() => {
                    const ITEM_H = 48
                    const TX = 5
                    const R = 12
                    const lastMidY = (filteredWords.length - 1) * ITEM_H + ITEM_H / 2
                    const trunkEnd = lastMidY - R
                    return (
                      <div className="relative ml-1" style={{ paddingLeft: 48 }}>
                        <svg
                          className="absolute left-0 top-0 pointer-events-none overflow-visible"
                          width={44}
                          height={filteredWords.length * ITEM_H}
                          fill="none"
                        >
                          <path
                            d={`M ${TX},0 L ${TX},${trunkEnd}`}
                            stroke="#00d5be"
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
                                d={`M ${TX},${midY - R} C ${TX},${midY} ${TX + R},${midY} ${TX + R + 2},${midY} L 42,${midY}`}
                                stroke="#00d5be"
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
                          <div key={wi} className="flex items-center gap-2" style={{ height: ITEM_H }}>
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
                                className="bg-[#f0fdfa] px-2 py-1 rounded-3xl transition-opacity disabled:opacity-50"
                              >
                                {navigatingWord === rw ? (
                                  <svg className="size-4 animate-spin text-[#009689]" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                  </svg>
                                ) : (
                                  <span className="text-sm font-medium text-[#009689] leading-4">{rw}</span>
                                )}
                              </button>
                              <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-700 px-3 py-2 text-xs text-white opacity-0 shadow-md transition-opacity group-hover/chip:opacity-100">
                                {displayLocale === 'ja' ? 'この単語を検索' : 'Search this word'}
                              </span>
                            </div>
                            {part.relatedWordMeanings?.[rw] && (
                              <span className="text-xs text-[#009689] whitespace-nowrap">{part.relatedWordMeanings[rw]}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              )
            })}

            {/* Etymology description */}
            {hasEtymologyText && (
              <p className="text-sm text-[#00786f] leading-5">{displayedEtymologyDescription}</p>
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
                <div key={pos} className="px-2">
                  <span className="inline-flex items-center border border-[#90a1b9] rounded-full px-2 py-1 text-xs font-medium text-[#90a1b9]">
                    {getPosLabel(pos, displayLocale)}
                  </span>
                  <div className="mt-2 flex items-start gap-2">
                    <p className="flex-1 text-base font-medium text-black">{sense.meaning}</p>
                    <BsPinFill className="size-4 text-[#90a1b9] shrink-0 mt-1" />
                  </div>
                  {(sense.example || sense.exampleTranslation) && (
                    <div className="mt-2 flex flex-col gap-1 text-sm text-black">
                      {sense.example && <p>{sense.example}</p>}
                      {sense.exampleTranslation && <p>{sense.exampleTranslation}</p>}
                    </div>
                  )}
                </div>
              )]
            }

            return allEntries.map(([pos, items]) => (
              <div key={pos} className="px-2">
                <span className="inline-flex items-center border border-[#90a1b9] rounded-full px-2 py-1 text-xs font-medium text-[#90a1b9]">
                  {getPosLabel(pos, displayLocale)}
                </span>

                {pos === 'verb' && inflections.length > 0 && (
                  <p className="mt-1 text-sm text-[#90a1b9]">{inflections.join(' · ')}</p>
                )}

                <div className="mt-2 flex flex-col gap-4">
                  {items.map((sense) => {
                    const isPinned = pinnedSenseId === sense.senseId
                    return (
                      <div key={sense.senseId} className="group flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium text-black">{sense.meaning}</p>

                          {grammarTags[sense.senseId]?.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              <GrammarTags tags={grammarTags[sense.senseId]} displayLocale={displayLocale} />
                            </div>
                          )}

                          {(sense.example || sense.exampleTranslation) && (
                            <div className="mt-1.5 flex flex-col gap-1 text-sm text-black opacity-70">
                              {sense.example && <p>{sense.example}</p>}
                              {sense.exampleTranslation && <p>{sense.exampleTranslation}</p>}
                            </div>
                          )}
                        </div>

                        <div className="group/pin relative shrink-0">
                          <button
                            type="button"
                            onClick={() => onTogglePin(sense.senseId)}
                            className="flex size-8 items-center justify-center"
                          >
                            {isPinned
                              ? <BsPinFill className="size-4 text-[#009689]" />
                              : <BsPin className="size-4 text-[#90a1b9] opacity-0 transition-opacity group-hover:opacity-100 group-hover/pin:opacity-100" />
                            }
                          </button>
                          {!isPinned && (
                            <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-700 px-3 py-2 text-xs text-white opacity-0 shadow-md transition-opacity group-hover/pin:opacity-100">
                              {labels.pinThisSense}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          })()}
        </div>

        {/* ── SYNONYMS / ANTONYMS ── */}
        {synonyms.length > 0 && (
          <div className="mt-4 px-2">
            <p className="text-xs text-[#90a1b9] mb-1">{labels.synonyms}</p>
            <p className="text-sm text-black">{synonyms.slice(0, 8).join(', ')}</p>
          </div>
        )}
        {antonyms.length > 0 && (
          <div className="mt-3 px-2">
            <p className="text-xs text-[#90a1b9] mb-1">{labels.antonyms}</p>
            <p className="text-sm text-black">{antonyms.slice(0, 8).join(', ')}</p>
          </div>
        )}

        {/* ── DERIVATIVES ── */}
        {orderedDerivatives.length > 0 && (
          <div className="mt-3 px-2">
            <p className="text-xs text-[#90a1b9] mb-1.5">{labels.derivatives}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {orderedDerivatives.map(d => (
                <span key={d} className="text-sm text-[#009689] underline underline-offset-2">{d}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
