'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import DeckCard from '@/components/DeckCard'
import DeckLabelBadge from '@/components/DeckLabelBadge'

type Deck = { id: string; name: string; label: string; word_count: number }

const LABEL_ORDER = ['TOEIC', 'IELTS', 'TOEFL', '英検']

function toShortName(name: string, label: string) {
  return name.replace(new RegExp(`^${label}\\s*`), '').replace(/\+$/, '').trim() || name
}

export default function DecksPage() {
  const router = useRouter()
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('decks')
        .select('id, name, label, word_count')
        .order('label')
        .order('name')
        .limit(100)
      setDecks((data ?? []) as Deck[])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="bg-surface min-h-screen">
      <div className="flex justify-center w-full">
        <div className="w-full max-w-[860px] px-4 py-6 flex flex-col gap-8">

          <h1 className="text-xl font-bold text-gray-950">教材一覧</h1>

          {loading ? (
            <div className="flex justify-center py-16">
              <svg className="size-6 animate-spin text-muted" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : (
            <>
              {LABEL_ORDER.map(label => {
                const group = decks.filter(d => d.label === label)
                if (group.length === 0) return null
                return (
                  <section key={label}>
                    <DeckLabelBadge label={label} />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {group.map(deck => (
                        <DeckCard
                          key={deck.id}
                          title={toShortName(deck.name, deck.label)}
                          wordCount={deck.word_count}
                          onClick={() => router.push(`/decks/${deck.id}`)}
                        />
                      ))}
                    </div>
                  </section>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
