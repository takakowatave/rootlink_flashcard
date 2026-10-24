export const LABEL_ORDER = ['TOEIC', 'IELTS', 'TOEFL', '英検']

// 教材一覧 (/decks) だけに出すラベル。ダッシュボードの試験対策の並びには入れない
export const SERIES_LABELS = ['英会話']
export const DECKS_PAGE_LABEL_ORDER = [...LABEL_ORDER, ...SERIES_LABELS]

// シリーズ系 (英会話) はデッキ名が長く「ラベル+級」の形でもないので、表示を分ける
export function isSeriesLabel(label: string): boolean {
  return SERIES_LABELS.includes(label)
}

// デッキ画面のヘッダーなどに出す名前。試験系は「TOEIC600」、シリーズ系はデッキ名そのまま
export function deckHeaderTitle(name: string, label: string): string {
  return isSeriesLabel(label) ? name : `${label}${toShortName(name, label)}`
}

// 教材カード (DeckCard) に出す名前。シリーズ系は「｜」より前だけにしてラベルを重ねない
export function deckCardTitle(name: string, label: string): { label?: string; title: string } {
  if (isSeriesLabel(label)) return { title: name.split('｜')[0].trim() }
  return { label, title: toShortName(name, label) }
}

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
  '英会話-Cuppa English｜イギリス英語の会話表現': '/authors/cuppa-english.webp',
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
