import { createClient } from '@supabase/supabase-js'
import DeckScrollStrip from '@/components/DeckScrollStrip'
import DeckRequestForm from '@/components/DeckRequestForm'
import PageHeader from '@/components/PageHeader'
import { LABEL_ORDER, toShortName, getDeckImage, sortDecksByDifficulty } from '@/lib/deckDisplay'

type Deck = {
  id: string
  slug: string | null
  name: string
  label: string
  word_count: number
  is_premium: boolean
}

// 章単位の課金へ移行したため、デッキカードでは premium 判定を出さない (常に全デッキを開ける)
export default async function DecksPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: decksData } = await supabase
    .from('decks')
    .select('id, slug, name, label, word_count, is_premium')
    .eq('is_official', true)
    .order('label')
    .order('name')
    .limit(100)
  const decks = (decksData ?? []) as Deck[]

  return (
    <div className="bg-surface min-h-screen">
      <PageHeader
        items={[
          { label: 'ホーム', href: '/' },
          { label: '教材一覧' },
        ]}
      />
      <div className="flex justify-center w-full">
        <div className="w-full max-w-[860px] px-4 py-6 flex flex-col gap-8">

          <h1 className="text-xl font-bold text-gray-950">教材一覧</h1>

          {LABEL_ORDER.map(label => {
            const group = sortDecksByDifficulty(decks.filter(d => d.label === label))
            if (group.length === 0) return null
            return (
              <DeckScrollStrip
                key={label}
                label={label}
                items={group.map(deck => {
                  const shortName = toShortName(deck.name, deck.label)
                  return {
                    key: deck.id,
                    label: deck.label,
                    title: shortName,
                    imageSrc: getDeckImage(deck.label, shortName),
                    wordCount: deck.word_count,
                    href: `/decks/${deck.slug ?? deck.id}`,
                  }
                })}
              />
            )
          })}

          <DeckRequestForm />
        </div>
      </div>
    </div>
  )
}
