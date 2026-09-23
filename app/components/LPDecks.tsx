import DeckScrollStrip from '@/components/DeckScrollStrip'
import { getDeckImage } from '@/lib/deckDisplay'

type DeckGroup = {
  label: string
  decks: { name: string; shortName: string; wordCount: number; slug: string }[]
}

const DECK_GROUPS: DeckGroup[] = [
  {
    label: 'TOEIC',
    decks: [
      { slug: 'toeic-600', name: 'TOEIC 600+', shortName: '600', wordCount: 480 },
      { slug: 'toeic-730', name: 'TOEIC 730+', shortName: '730', wordCount: 379 },
      { slug: 'toeic-860', name: 'TOEIC 860+', shortName: '860', wordCount: 292 },
      { slug: 'toeic-990', name: 'TOEIC 990+', shortName: '990', wordCount: 191 },
    ],
  },
  {
    label: 'IELTS',
    decks: [
      { slug: 'ielts-5-5', name: 'IELTS 5.5', shortName: '5.5', wordCount: 269 },
      { slug: 'ielts-6-5', name: 'IELTS 6.5', shortName: '6.5', wordCount: 342 },
      { slug: 'ielts-7-5', name: 'IELTS 7.5', shortName: '7.5', wordCount: 167 },
    ],
  },
  {
    label: 'TOEFL',
    decks: [
      { slug: 'toefl-60', name: 'TOEFL 60', shortName: 'iBT 60', wordCount: 200 },
      { slug: 'toefl-80', name: 'TOEFL 80', shortName: 'iBT 80', wordCount: 200 },
      { slug: 'toefl-100', name: 'TOEFL 100', shortName: 'iBT 100', wordCount: 200 },
    ],
  },
  {
    label: '英検',
    decks: [
      { slug: 'eiken-grade-pre-1', name: '英検 準1級', shortName: '準1級', wordCount: 363 },
      { slug: 'eiken-grade-1', name: '英検 1級', shortName: '1級', wordCount: 383 },
    ],
  },
]

export default function LPDecks() {
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
            <DeckScrollStrip
              key={group.label}
              label={group.label}
              items={group.decks.map(deck => ({
                key: deck.slug,
                label: group.label,
                title: deck.shortName,
                imageSrc: getDeckImage(group.label, deck.shortName),
                wordCount: deck.wordCount,
                href: `/decks/${deck.slug}`,
              }))}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
