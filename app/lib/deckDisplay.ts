export const LABEL_ORDER = ['TOEIC', 'IELTS', 'TOEFL', '英検']

const DECK_IMAGES: Record<string, string> = {
  'TOEIC-頻出': '/deck-covers/toeic-frequent.png',
  'TOEIC-600': '/deck-covers/toeic-600.png',
  'TOEIC-730': '/deck-covers/toeic-730.png',
  'TOEIC-860': '/deck-covers/toeic-860.png',
  'TOEIC-990': '/deck-covers/toeic-990.png',
  'IELTS-5.5': '/deck-covers/ielts-5.5.png',
  'IELTS-6.5': '/deck-covers/ielts-6.5.png',
  'IELTS-7.5': '/deck-covers/ielts-7.5.png',
  'TOEFL-iBT 60': '/deck-covers/toefl-60.png',
  'TOEFL-iBT 80': '/deck-covers/toefl-80.png',
  'TOEFL-iBT 100': '/deck-covers/toefl-100.png',
  'TOEFL-60': '/deck-covers/toefl-60.png',
  'TOEFL-80': '/deck-covers/toefl-80.png',
  'TOEFL-100': '/deck-covers/toefl-100.png',
  '英検-準1級': '/deck-covers/eiken-jun1.png',
  '英検-1級': '/deck-covers/eiken-1.png',
}

export function toShortName(name: string, label: string) {
  return name.replace(new RegExp(`^${label}\\s*`), '').replace(/\+$/, '').trim() || name
}

export function getDeckImage(label: string, shortName: string): string | undefined {
  return DECK_IMAGES[`${label}-${shortName}`]
}

// ラベルごとの難易度順 (低→高)。leftmost=最易。
const DIFFICULTY_ORDER: Record<string, string[]> = {
  TOEIC: ['頻出', '600', '730', '860', '990'],
  IELTS: ['5.5', '6.5', '7.5'],
  TOEFL: ['iBT 60', 'iBT 80', 'iBT 100', '60', '80', '100'],
  英検: ['準1級', '1級'],
}

function difficultyRank(label: string, shortName: string): number {
  const order = DIFFICULTY_ORDER[label]
  if (!order) return 999
  const idx = order.indexOf(shortName)
  return idx === -1 ? 999 : idx
}

export type DeckSortable = { name: string; label: string; is_premium: boolean }

// 無料 (leftmost) → 難易度昇順 で並び替え
export function sortDecksByDifficulty<T extends DeckSortable>(decks: T[]): T[] {
  return [...decks].sort((a, b) => {
    if (a.is_premium !== b.is_premium) return a.is_premium ? 1 : -1
    const rankA = difficultyRank(a.label, toShortName(a.name, a.label))
    const rankB = difficultyRank(b.label, toShortName(b.name, b.label))
    if (rankA !== rankB) return rankA - rankB
    return a.name.localeCompare(b.name)
  })
}
