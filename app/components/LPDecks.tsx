'use client'

import { useRouter } from 'next/navigation'
import DeckCard from '@/components/DeckCard'
import DeckLabelBadge from '@/components/DeckLabelBadge'

type DeckGroup = {
  label: string
  decks: { name: string; shortName: string; wordCount: number; id: string }[]
}

const DECK_IMAGES: Record<string, string> = {
  'TOEIC-600': '/deck-covers/toeic-600.png',
  'TOEIC-730': '/deck-covers/toeic-730.png',
  'TOEIC-860': '/deck-covers/toeic-860.png',
  'TOEIC-990': '/deck-covers/toeic-990.png',
}

const DECK_GROUPS: DeckGroup[] = [
  {
    label: 'TOEIC',
    decks: [
      { id: '987c37d0-6053-490f-8949-b3f1f6cb121d', name: 'TOEIC 600+', shortName: '600', wordCount: 480 },
      { id: 'bd189d85-4a9b-48e8-9c5a-0bfdcdcfef19', name: 'TOEIC 730+', shortName: '730', wordCount: 379 },
      { id: '3c432bc7-766e-4882-88a9-55ddcbb7b308', name: 'TOEIC 860+', shortName: '860', wordCount: 292 },
      { id: 'd64d8a2f-ea22-422a-838f-19bb4a55850d', name: 'TOEIC 990+', shortName: '990', wordCount: 191 },
    ],
  },
  {
    label: 'IELTS',
    decks: [
      { id: '69524dec-d44b-45bd-8807-de0a1b5755bd', name: 'IELTS 5.5', shortName: '5.5', wordCount: 269 },
      { id: 'a5eebca9-e2ad-4e7e-b4a2-9db20dfb17fe', name: 'IELTS 6.5', shortName: '6.5', wordCount: 342 },
      { id: 'b8d7ee35-d4dd-400b-989b-85946c53212a', name: 'IELTS 7.5', shortName: '7.5', wordCount: 167 },
    ],
  },
  {
    label: 'TOEFL',
    decks: [
      { id: '0cdb13ba-9060-4e84-8d01-b64a8a906e67', name: 'TOEFL 60', shortName: 'iBT 60', wordCount: 200 },
      { id: '21086a87-e458-452f-a105-57fc4bf6971c', name: 'TOEFL 80', shortName: 'iBT 80', wordCount: 200 },
      { id: 'd57aef47-1190-4bd9-9ce6-23eb495eeb43', name: 'TOEFL 100', shortName: 'iBT 100', wordCount: 200 },
    ],
  },
  {
    label: '英検',
    decks: [
      { id: 'ba7d9ef3-6b98-4011-8e62-2aa35779336a', name: '英検 準1級', shortName: '準1級', wordCount: 363 },
      { id: 'fd534c6c-13d2-4d01-a819-0120ec1c5b1b', name: '英検 1級', shortName: '1級', wordCount: 383 },
    ],
  },
]

export default function LPDecks() {
  const router = useRouter()

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-[860px] mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-primary leading-tight mb-4">
            試験対策の教材も充実
          </h2>
          <p className="text-[15px] text-gray-500 leading-relaxed">
            RootLinkは試験対策にも対応。オリジナルの単語帳も作れますが、<br className="hidden sm:inline" />
            幅広い試験対策の教材も用意しています。
          </p>
        </div>

        <div className="flex flex-col gap-10">
          {DECK_GROUPS.map(group => (
            <div key={group.label}>
              <DeckLabelBadge label={group.label} />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {group.decks.map(deck => (
                  <DeckCard
                    key={deck.id}
                    title={deck.shortName}
                    wordCount={deck.wordCount}
                    imageSrc={DECK_IMAGES[`${group.label}-${deck.shortName}`]}
                    onClick={() => router.push(`/decks/${deck.id}`)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
