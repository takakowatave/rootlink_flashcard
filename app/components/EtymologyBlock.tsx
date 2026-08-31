'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MdRemoveCircle, MdAddCircle } from 'react-icons/md'
import { supabase } from '@/lib/supabaseClient'
import { readLocalizedEtymologyJa, isRedundantEtymologyDescription } from '@/lib/etymologyDisplay'
import { useWordDetail } from '@/lib/wordDetailStack'
import type { EtymologyData, EtymologyPart, LocalizedEtymologyJa } from '@/types/Etymology'
import type { DisplayLocale } from '@/types/DisplayLocale'
import type { RewrittenPayload } from '@/types/Dictionary'

export { readLocalizedEtymologyJa }

type Props = {
  headword: string
  etymologyData?: EtymologyData | null
  localizedEtymologyJa?: LocalizedEtymologyJa | null
  etymology?: string
  displayLocale?: DisplayLocale
  /** TutorialOverlay が拾うマーカー。ページ内で二重に描かれるケース (Quiz など) では false にする */
  withTutorialAttr?: boolean
}

export default function EtymologyBlock({
  headword,
  etymologyData,
  localizedEtymologyJa,
  etymology = '',
  displayLocale = 'en',
  withTutorialAttr = true,
}: Props) {
  const ownParts = useMemo(
    () => etymologyData?.structure.type === 'parts'
      ? etymologyData.structure.parts.filter(p => p.text || p.meaning)
      : [],
    [etymologyData],
  )

  const router = useRouter()
  const wordDetail = useWordDetail()
  const [navigatingWord, setNavigatingWord] = useState<string | null>(null)
  const [partWordMap, setPartWordMap] = useState<Record<string, string[]>>({})
  const [wordMeaningJa, setWordMeaningJa] = useState<Record<string, string>>({})
  const [inheritedParts, setInheritedParts] = useState<EtymologyPart[]>([])
  const [expandedParts, setExpandedParts] = useState<boolean[]>([])

  // type: 'origin' の単語は wordFamily の他語から parts を継承する。
  // 継承元は「parts に同族語が含まれていないもの」に限定する
  // (継承元の分解が同族語を部品として含んでいると根本まで辿れないため)。
  useEffect(() => {
    if (etymologyData?.structure.type !== 'origin') { setInheritedParts([]); return }
    const family = (etymologyData.wordFamily ?? [])
      .map(w => w.toLowerCase())
      .filter(w => w && w !== headword.toLowerCase())
    if (family.length === 0) { setInheritedParts([]); return }
    const familySet = new Set(family)
    let cancelled = false
    ;(async () => {
      const { data: wordRows } = await supabase
        .from('words')
        .select('id, word')
        .in('word', family)
        .limit(family.length)
      const rows = (wordRows ?? []) as { id: string; word: string }[]
      if (rows.length === 0) return
      const idToWord = new Map(rows.map(r => [r.id, r.word.toLowerCase()]))
      const ids = rows.map(r => r.id)
      const { data: cacheRows } = await supabase
        .from('dictionary_cache')
        .select('word_id, payload')
        .in('word_id', ids)
        .limit(ids.length)
      const candidates: { word: string; parts: EtymologyPart[] }[] = []
      for (const c of (cacheRows ?? []) as { word_id: string; payload: RewrittenPayload }[]) {
        const w = idToWord.get(c.word_id)
        if (!w) continue
        const structure = c.payload?.etymologyData?.structure
        if (!structure || structure.type !== 'parts') continue
        const parts = structure.parts.filter(p => p.text || p.meaning)
        if (parts.length === 0) continue
        const containsFamilyMember = parts.some(p => familySet.has(p.text.toLowerCase()))
        if (containsFamilyMember) continue
        candidates.push({ word: w, parts })
      }
      if (cancelled || candidates.length === 0) return
      const preferred = family.map(f => candidates.find(c => c.word === f)).find(Boolean)
      setInheritedParts((preferred ?? candidates[0])!.parts)
    })()
    return () => { cancelled = true }
  }, [etymologyData, headword])

  const parts = ownParts.length > 0 ? ownParts : inheritedParts
  useEffect(() => { setExpandedParts(parts.map(() => false)) }, [parts])

  useEffect(() => {
    if (parts.length === 0) return
    parts.forEach(part => {
      if (!part?.text) return
      const partText = part.text.toLowerCase()
      const meaningJa = part.meaningJa?.trim() ?? null
      const meaningEn = part.meaning?.trim() ?? null
      // 意味が空のパーツは絞りようがないのでスペル一致のみ（従来通り）
      let query = supabase
        .from('etymology_part_words')
        .select('word, meaning_en, meaning_ja')
        .eq('part_text', partText)
        .neq('word', headword.toLowerCase())
        .limit(24)
      if (meaningJa) {
        query = query.eq('meaning_ja', meaningJa)
      } else if (meaningEn) {
        query = query.eq('meaning_en', meaningEn)
      }
      query.then(({ data }) => {
        if (data && data.length > 0) {
          setPartWordMap(prev => ({ ...prev, [partText]: data.map(d => d.word).slice(0, 8) }))
        }
      })
    })
  }, [parts, headword])

  // 関連語チップ横に出す日本語訳を dictionary_cache から取得
  useEffect(() => {
    const allWords = new Set<string>()
    Object.values(partWordMap).forEach(list => list.forEach(w => allWords.add(w)))
    const missing = Array.from(allWords).filter(w => !(w in wordMeaningJa))
    if (missing.length === 0) return
    let cancelled = false
    ;(async () => {
      const { data: wordRows } = await supabase
        .from('words')
        .select('id, word')
        .in('word', missing)
        .limit(missing.length)
      const rows = (wordRows ?? []) as { id: string; word: string }[]
      if (rows.length === 0) return
      const idToWord = new Map(rows.map(r => [r.id, r.word.toLowerCase()]))
      const ids = rows.map(r => r.id)
      const { data: cacheRows } = await supabase
        .from('dictionary_cache')
        .select('word_id, payload')
        .in('word_id', ids)
        .limit(ids.length)
      const next: Record<string, string> = {}
      for (const c of (cacheRows ?? []) as { word_id: string; payload: RewrittenPayload }[]) {
        const w = idToWord.get(c.word_id)
        if (!w) continue
        const firstGroup = c.payload?.senseGroups?.[0]
        const senseId = firstGroup?.senses?.[0]?.senseId ?? ''
        const meaning =
          c.payload?.locales?.ja?.senses?.[senseId]?.meaning?.trim() ||
          firstGroup?.senses?.[0]?.definition?.trim() ||
          ''
        if (meaning) next[w] = meaning
      }
      if (!cancelled && Object.keys(next).length > 0) {
        setWordMeaningJa(prev => ({ ...prev, ...next }))
      }
    })()
    return () => { cancelled = true }
  }, [partWordMap, wordMeaningJa])

  const hasParts = parts.length > 0

  const displayedEtymologyDescription = displayLocale === 'ja'
    ? localizedEtymologyJa?.description ?? etymology
    : etymology

  const hasEtymologyText = Boolean(
    displayedEtymologyDescription?.trim() &&
    !isRedundantEtymologyDescription(displayedEtymologyDescription),
  )

  if (!hasParts && !hasEtymologyText) return null

  return (
    <div
      {...(withTutorialAttr ? { 'data-tutorial': 'etymology-tree' } : {})}
      className="mt-2 bg-primary-subtle rounded-sm px-2 py-2 flex flex-col gap-[16px] overflow-x-hidden"
    >
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
              className={`bg-primary-light rounded-lg min-w-0 flex flex-col gap-2 basis-full max-w-full md:basis-[calc(50%-4px)] md:max-w-[calc(50%-4px)] ${filteredWords.length > 0 ? 'p-2' : 'px-3.5 py-2'}`}
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
                        ? <MdRemoveCircle className="size-5 text-primary-hover" />
                        : <MdAddCircle    className="size-5 text-primary-hover" />
                      }
                      <span className="text-base font-medium text-primary-hover leading-4">{part.text}</span>
                    </button>
                  ) : (
                    <div className="bg-white border-2 border-primary-mid rounded-[24px] px-[12px] py-[4px]">
                      <span className="text-base font-medium text-primary-hover leading-4">{part.text}</span>
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-primary-hover leading-[28px]">{gloss}</span>
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
                        stroke="#009689"
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
                            stroke="#009689"
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
                    {filteredWords.map((rw, wi) => {
                      const meaning =
                        wordMeaningJa[rw.toLowerCase()] ||
                        part.relatedWordMeanings?.[rw] ||
                        ''
                      return (
                        <div key={wi} className="flex items-center gap-2 min-w-0" style={{ height: ITEM_H }}>
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
                                  if (!data?.ok) return
                                  if (wordDetail) {
                                    wordDetail.open({
                                      word: typeof data.resolved === 'string' ? data.resolved : rw,
                                      dictionary: data.dictionary ?? data.raw ?? null,
                                      pinned_sense_id: null,
                                    })
                                  } else if (typeof data.redirectTo === 'string') {
                                    router.push(data.redirectTo)
                                  }
                                } finally {
                                  setNavigatingWord(null)
                                }
                              }}
                              className="bg-primary-subtle px-[8px] py-[4px] rounded-[24px] transition-opacity disabled:opacity-50"
                            >
                              {navigatingWord === rw ? (
                                <svg className="size-4 animate-spin text-primary-hover" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                              ) : (
                                <span className="text-[14px] font-medium text-primary-hover leading-4">{rw}</span>
                              )}
                            </button>
                            <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-700 px-3 py-2 text-xs text-white opacity-0 shadow-md transition-opacity group-hover/chip:opacity-100">
                              {displayLocale === 'ja' ? 'この単語を検索' : 'Search this word'}
                            </span>
                          </div>
                          {meaning && (
                            <span className="text-[12px] font-medium text-primary-hover leading-4 truncate min-w-0">
                              {meaning}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          )
        })}
      </div>

      {/* Etymology description */}
      {hasEtymologyText && (
        <p className="text-[14px] text-primary-hover leading-[20px]">{displayedEtymologyDescription}</p>
      )}
    </div>
  )
}
