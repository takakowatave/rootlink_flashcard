import DeckScrollStrip from '@/components/DeckScrollStrip'
import { getDeckImage } from '@/lib/deckDisplay'
import { lpCopy } from '@/lib/lp-copy'
import type { DisplayLocale } from '@/types/DisplayLocale'

interface Props {
  locale: DisplayLocale
}

// imageLabel / imageShortName は getDeckImage のキー (日本語固定) と対応。
// 表示用の label / title は locale に応じた文字列。
type DeckItem = { name: string; shortName: string; wordCount: number; slug: string; imageLabel: string; imageShortName: string }
type DeckGroup = { key: 'TOEIC' | 'IELTS' | 'TOEFL' | 'eiken'; decks: DeckItem[] }

const DECK_GROUPS: DeckGroup[] = [
  {
    key: 'TOEIC',
    decks: [
      { slug: 'toeic-600', name: 'TOEIC 600+', shortName: '600', wordCount: 480, imageLabel: 'TOEIC', imageShortName: '600' },
      { slug: 'toeic-730', name: 'TOEIC 730+', shortName: '730', wordCount: 379, imageLabel: 'TOEIC', imageShortName: '730' },
      { slug: 'toeic-860', name: 'TOEIC 860+', shortName: '860', wordCount: 292, imageLabel: 'TOEIC', imageShortName: '860' },
      { slug: 'toeic-990', name: 'TOEIC 990+', shortName: '990', wordCount: 191, imageLabel: 'TOEIC', imageShortName: '990' },
    ],
  },
  {
    key: 'IELTS',
    decks: [
      { slug: 'ielts-5-5', name: 'IELTS 5.5', shortName: '5.5', wordCount: 269, imageLabel: 'IELTS', imageShortName: '5.5' },
      { slug: 'ielts-6-5', name: 'IELTS 6.5', shortName: '6.5', wordCount: 342, imageLabel: 'IELTS', imageShortName: '6.5' },
      { slug: 'ielts-7-5', name: 'IELTS 7.5', shortName: '7.5', wordCount: 167, imageLabel: 'IELTS', imageShortName: '7.5' },
    ],
  },
  {
    key: 'TOEFL',
    decks: [
      { slug: 'toefl-60',  name: 'TOEFL 60',  shortName: 'iBT 60',  wordCount: 200, imageLabel: 'TOEFL', imageShortName: 'iBT 60' },
      { slug: 'toefl-80',  name: 'TOEFL 80',  shortName: 'iBT 80',  wordCount: 200, imageLabel: 'TOEFL', imageShortName: 'iBT 80' },
      { slug: 'toefl-100', name: 'TOEFL 100', shortName: 'iBT 100', wordCount: 200, imageLabel: 'TOEFL', imageShortName: 'iBT 100' },
    ],
  },
  {
    key: 'eiken',
    decks: [
      { slug: 'eiken-grade-pre-1', name: '英検 準1級', shortName: '準1級', wordCount: 363, imageLabel: '英検', imageShortName: '準1級' },
      { slug: 'eiken-grade-1',     name: '英検 1級',   shortName: '1級',   wordCount: 383, imageLabel: '英検', imageShortName: '1級'  },
    ],
  },
]

export default function LPDecks({ locale }: Props) {
  const copy = lpCopy[locale].decks

  const localizedShortName = (groupKey: DeckGroup['key'], raw: string): string => {
    if (groupKey !== 'eiken') return raw
    if (raw === '準1級') return copy.pre1Label
    if (raw === '1級')   return copy.g1Label
    return raw
  }

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-[860px] mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-primary leading-tight mb-4">
            {copy.title}
          </h2>
          <p className="text-[15px] text-gray-500 leading-relaxed">
            {copy.body}
          </p>
        </div>

        <div className="flex flex-col gap-10">
          {DECK_GROUPS.map(group => (
            <DeckScrollStrip
              key={group.key}
              label={copy.groups[group.key]}
              items={group.decks.map(deck => ({
                key: deck.slug,
                label: copy.groups[group.key],
                title: localizedShortName(group.key, deck.shortName),
                imageSrc: getDeckImage(deck.imageLabel, deck.imageShortName),
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
