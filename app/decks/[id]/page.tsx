import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import DeckClient from './DeckClient'

export default async function DeckPage({ params }: { params: { id: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: deck } = await supabase
    .from('decks')
    .select('id, name, label, description')
    .eq('id', params.id)
    .single()

  if (!deck) notFound()

  return <DeckClient deck={deck} />
}
