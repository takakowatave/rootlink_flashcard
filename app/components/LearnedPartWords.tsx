'use client'

import { useEffect, useMemo, useState } from 'react'
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs'
import { supabase } from '@/lib/supabaseClient'
import { POS_LABEL_JA } from '@/lib/pos'
import type { EtymologyData, EtymologyPart } from '@/types/Etymology'
import type { RewrittenPayload } from '@/types/Dictionary'

export type LearnedWord = {
  word: string
  pos?: string
  meaningJa?: string
  isSaved: boolean
}

export type LearnedPartGroup = {
  part: EtymologyPart
  words: LearnedWord[]
}

type Props = {
  headword: string
  etymologyData?: EtymologyData | null
  onSelectWord?: (word: string) => void
}

export default function LearnedPartWords({ headword, etymologyData, onSelectWord }: Props) {
  const parts = useMemo(
    () => etymologyData?.structure.type === 'parts'
      ? etymologyData.structure.parts.filter(p => p.text)
      : [],
    [etymologyData],
  )

  const [groups, setGroups] = useState<LearnedPartGroup[]>([])

  useEffect(() => {
    if (parts.length === 0) { setGroups([]); return }
    let cancelled = false

    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [savedRes, quizRes] = await Promise.all([
        supabase.from('saved_words').select('words(word)').eq('user_id', user.id).limit(5000),
        supabase.from('quiz_results').select('word').eq('user_id', user.id).limit(5000),
      ])

      const savedSet = new Set<string>()
      for (const r of (savedRes.data ?? []) as unknown as { words: { word: string } | null }[]) {
        if (r.words?.word) savedSet.add(r.words.word.toLowerCase())
      }
      const learnedSet = new Set<string>(savedSet)
      for (const r of (quizRes.data ?? []) as { word: string }[]) {
        if (r.word) learnedSet.add(r.word.toLowerCase())
      }
      learnedSet.delete(headword.toLowerCase())

      const candidateWords = Array.from(learnedSet)
      if (candidateWords.length === 0) { if (!cancelled) setGroups([]); return }

      const partTexts = parts.map(p => p.text.toLowerCase())
      const { data: epwRows } = await supabase
        .from('etymology_part_words')
        .select('part_text, word')
        .in('part_text', partTexts)
        .in('word', candidateWords)
        .limit(2000)

      const wordsByPart = new Map<string, string[]>()
      for (const row of (epwRows ?? []) as { part_text: string; word: string }[]) {
        const list = wordsByPart.get(row.part_text) ?? []
        if (!list.includes(row.word)) list.push(row.word)
        wordsByPart.set(row.part_text, list)
      }

      const allWordsSet = new Set<string>()
      for (const list of wordsByPart.values()) list.forEach(w => allWordsSet.add(w))
      const allWords = Array.from(allWordsSet)

      const wordMeta = new Map<string, { pos?: string; meaningJa?: string }>()
      if (allWords.length > 0) {
        const { data: wordRows } = await supabase
          .from('words')
          .select('id, word')
          .in('word', allWords)
          .limit(allWords.length)
        const idToWord = new Map<string, string>()
        const ids: string[] = []
        for (const r of (wordRows ?? []) as { id: string; word: string }[]) {
          idToWord.set(r.id, r.word.toLowerCase())
          ids.push(r.id)
        }
        if (ids.length > 0) {
          const { data: cacheRows } = await supabase
            .from('dictionary_cache')
            .select('word_id, payload')
            .in('word_id', ids)
            .limit(ids.length)
          for (const r of (cacheRows ?? []) as { word_id: string; payload: RewrittenPayload }[]) {
            const w = idToWord.get(r.word_id)
            if (!w) continue
            const firstGroup = r.payload?.senseGroups?.[0]
            const pos = firstGroup?.partOfSpeech
            const senseId = firstGroup?.senses?.[0]?.senseId ?? ''
            const meaningJa = r.payload?.locales?.ja?.senses?.[senseId]?.meaning
              ?? firstGroup?.senses?.[0]?.definition
              ?? undefined
            wordMeta.set(w, { pos, meaningJa: meaningJa ?? undefined })
          }
        }
      }

      const nextGroups: LearnedPartGroup[] = parts
        .map(part => {
          const list = wordsByPart.get(part.text.toLowerCase()) ?? []
          const words: LearnedWord[] = list.slice(0, 3).map(w => ({
            word: w,
            pos: wordMeta.get(w)?.pos,
            meaningJa: wordMeta.get(w)?.meaningJa,
            isSaved: savedSet.has(w),
          }))
          return { part, words }
        })
        .filter(g => g.words.length > 0)

      if (!cancelled) setGroups(nextGroups)
    })()

    return () => { cancelled = true }
  }, [parts, headword])

  if (groups.length === 0) return null

  return <LearnedPartWordsView groups={groups} onSelectWord={onSelectWord} />
}

export function LearnedPartWordsView({ groups, onSelectWord }: { groups: LearnedPartGroup[]; onSelectWord?: (word: string) => void }) {
  if (groups.length === 0) return null
  return (
    <div className="flex flex-col gap-2 w-full mt-4">
      <p className="text-base font-medium text-gray-950 leading-6">過去に学習した同パーツを持つ単語</p>
      <div className="bg-slate-50 rounded-lg p-2 flex flex-col gap-4">
        {groups.map((g, gi) => (
          <PartGroupTree key={`${g.part.text}-${gi}`} group={g} onSelectWord={onSelectWord} />
        ))}
      </div>
    </div>
  )
}

function PartGroupTree({ group, onSelectWord }: { group: LearnedPartGroup; onSelectWord?: (word: string) => void }) {
  const { part, words } = group
  const gloss = part.meaningJa ?? part.meaning ?? ''

  const ITEM_H = 52
  const ITEM_GAP = 8
  const TX = 5
  const R = 10
  const rowStride = ITEM_H + ITEM_GAP
  const lastMidY = (words.length - 1) * rowStride + ITEM_H / 2
  const trunkEnd = lastMidY - R

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="bg-white border-2 border-primary-mid rounded-[24px] px-[12px] py-[4px]">
          <span className="text-base font-medium text-primary-hover leading-4">{part.text}</span>
        </div>
        {gloss && <span className="text-sm font-medium text-primary-hover">{gloss}</span>}
      </div>
      <div className="relative pl-[24px]">
        <svg
          className="absolute left-2 top-0 pointer-events-none overflow-visible"
          width={20}
          height={words.length * rowStride}
          fill="none"
        >
          <path
            d={`M ${TX},0 L ${TX},${trunkEnd}`}
            stroke="#009689"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {words.map((_, wi) => {
            const midY = wi * rowStride + ITEM_H / 2
            return (
              <path
                key={wi}
                d={`M ${TX},${midY - R} C ${TX},${midY} ${TX + R},${midY} ${TX + R + 2},${midY} L 18,${midY}`}
                stroke="#009689"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            )
          })}
        </svg>
        <div className="flex flex-col" style={{ gap: ITEM_GAP }}>
          {words.map((w, wi) => (
            <button
              key={wi}
              type="button"
              onClick={() => onSelectWord?.(w.word)}
              className="bg-white border-2 border-line rounded-lg px-2 py-2 flex items-center gap-2 w-full text-left hover:border-primary-mid transition-colors"
              style={{ height: ITEM_H }}
            >
              <span className="text-base font-medium text-gray-950 leading-6 shrink-0">{w.word}</span>
              {w.pos && (
                <span className="border border-muted rounded-full px-2 py-1 text-xs font-medium text-muted shrink-0">
                  {POS_LABEL_JA[w.pos] ?? w.pos}
                </span>
              )}
              <span className="flex-1 min-w-0 text-sm text-muted leading-5 truncate">
                {w.meaningJa ?? ''}
              </span>
              {w.isSaved
                ? <BsBookmarkFill className="size-5 text-primary-hover shrink-0" />
                : <BsBookmark className="size-5 text-muted shrink-0" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
