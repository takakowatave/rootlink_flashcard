export const LABEL_ORDER = ['TOEIC', 'IELTS', 'TOEFL', '英検']

const DECK_IMAGES: Record<string, string> = {
  'TOEIC-600': '/deck-covers/toeic-600.png',
  'TOEIC-730': '/deck-covers/toeic-730.png',
  'TOEIC-860': '/deck-covers/toeic-860.png',
  'TOEIC-990': '/deck-covers/toeic-990.png',
}

export function toShortName(name: string, label: string) {
  return name.replace(new RegExp(`^${label}\\s*`), '').replace(/\+$/, '').trim() || name
}

export function getDeckImage(label: string, shortName: string): string | undefined {
  return DECK_IMAGES[`${label}-${shortName}`]
}
