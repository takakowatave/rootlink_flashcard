export const CHAPTER_SIZE = 50

export function chapterOfPosition(position: number): number {
  return Math.floor(position / CHAPTER_SIZE) + 1
}

export function chapterCount(totalWords: number): number {
  if (totalWords <= 0) return 0
  return Math.ceil(totalWords / CHAPTER_SIZE)
}

/**
 * 無料プランで開ける章数。
 * - is_premium=false のデッキは全章無料
 * - is_premium=true のデッキは max(1, min(4, floor(章数/2)))
 * 数字を変えたいときはこの関数だけ書き換える。
 */
export function freeChapterCount(isPremiumDeck: boolean, totalChapters: number): number {
  if (!isPremiumDeck) return totalChapters
  if (totalChapters <= 0) return 0
  return Math.max(1, Math.min(4, Math.floor(totalChapters / 2)))
}

export function isChapterLocked(
  chapterNo: number,
  isPremiumDeck: boolean,
  totalChapters: number,
  plan: 'premium' | 'free' | null,
): boolean {
  if (plan === 'premium') return false
  if (!isPremiumDeck) return false
  return chapterNo > freeChapterCount(true, totalChapters)
}
