export const LABEL_ORDER = ['TOEIC', 'IELTS', 'TOEFL', '英検']

const DECK_IMAGES: Record<string, string> = {
  'TOEIC-600': '/deck-covers/toeic-600.png',
  'TOEIC-730': '/deck-covers/toeic-730.png',
  'TOEIC-860': '/deck-covers/toeic-860.png',
  'TOEIC-990': '/deck-covers/toeic-990.png',
  'IELTS-5.5': '/deck-covers/ielts-5.5.png',
  'IELTS-6.5': '/deck-covers/ielts-6.5.png',
  'IELTS-7.5': '/deck-covers/ielts-7.5.png',
  '英検-準1級': '/deck-covers/eiken-jun1.png',
  '英検-1級': '/deck-covers/eiken-1.png',
}

export function toShortName(name: string, label: string) {
  return name.replace(new RegExp(`^${label}\\s*`), '').replace(/\+$/, '').trim() || name
}

export function getDeckImage(label: string, shortName: string): string | undefined {
  return DECK_IMAGES[`${label}-${shortName}`]
}
