'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import EtymologyPartPill from '@/components/EtymologyPartPill'

interface Props {
  partText: string
  meaning: string
  headword: string
}

export default function EtymologyPartNode({ partText, meaning, headword }: Props) {
  const [relatedWords, setRelatedWords] = useState<string[]>([])
  const [expanded, setExpanded] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    supabase
      .from('etymology_part_words')
      .select('word')
      .eq('part_text', partText.toLowerCase())
      .neq('word', headword.toLowerCase())
      .limit(8)
      .then(({ data }) => {
        setRelatedWords(data?.map((d) => d.word) ?? [])
        setChecked(true)
      })
  }, [partText, headword])

  const hasRelated = checked && relatedWords.length > 0

  return (
    <div className="flex flex-col">
      <div className="flex min-w-[220px] items-center gap-3 rounded-xl bg-primary-light px-4 py-3">
        {hasRelated ? (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white"
          >
            {expanded ? '−' : '+'}
          </button>
        ) : (
          <div className="h-6 w-6 shrink-0" />
        )}

        <EtymologyPartPill partText={partText} />
        <span className="text-sm text-primary">{meaning}</span>
      </div>

      {expanded && (
        <div className="ml-6 mt-1 flex flex-col gap-1 border-l-2 border-primary-mid pl-4">
          {relatedWords.map((word) => (
            <Link
              key={word}
              href={`/word/${word}`}
              className="rounded-full border border-primary-mid bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-primary-subtle"
            >
              {word}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
