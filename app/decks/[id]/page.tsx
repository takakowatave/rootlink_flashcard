import { cache } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import DeckClient from './DeckClient'
import { toShortName } from '@/lib/deckDisplay'

type DeckRow = {
  id: string
  name: string
  label: string
  description: string | null
  is_premium: boolean
  word_count: number
  is_official: boolean
}

const getDeck = cache(async (id: string): Promise<DeckRow | null> => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase
    .from('decks')
    .select('id, name, label, description, is_premium, word_count, is_official')
    .eq('id', id)
    .single()
  return (data as DeckRow | null) ?? null
})

function buildTitleHead(label: string, shortName: string): string {
  if (label === 'TOEIC') return shortName === '頻出' ? 'TOEIC 頻出' : `TOEIC ${shortName}点`
  if (label === '英検') return `英検${shortName}`
  return `${label} ${shortName}`
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const deck = await getDeck(params.id)
  if (!deck) return { title: 'RootLink' }

  const shortName = toShortName(deck.name, deck.label)
  const head = buildTitleHead(deck.label, shortName)
  const title = `${head}の英単語${deck.word_count}語｜語源で覚えるRootLink`
  const description =
    deck.description ??
    `${head}レベルの重要英単語${deck.word_count}語を、語源から理解して定着させる単語帳。`

  const meta: Metadata = {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary', title, description },
  }
  if (!deck.is_official) {
    meta.robots = { index: false, follow: true }
  }
  return meta
}

export default async function DeckPage({ params }: { params: { id: string } }) {
  const deck = await getDeck(params.id)
  if (!deck) notFound()

  return (
    <DeckClient
      deck={{
        id: deck.id,
        name: deck.name,
        label: deck.label,
        description: deck.description,
        is_premium: deck.is_premium,
      }}
    />
  )
}
