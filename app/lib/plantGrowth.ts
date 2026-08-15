// 鉢植えの成長ロジック。
// スコア = クイズ解答数 + 累計ログイン日数 × 3
// 一度でも休むと枯れるのは避けたいので、スコアは単調増加のみ。

type PlantLevel = { level: number; minScore: number; src: string }

const PLANT_LEVELS: PlantLevel[] = [
  { level: 1, minScore: 0, src: '/plant/my-wordlist.png' },
  { level: 2, minScore: 30, src: '/plant/my-wordlist.png' },
  { level: 3, minScore: 100, src: '/plant/my-wordlist.png' },
  { level: 4, minScore: 300, src: '/plant/my-wordlist.png' },
  { level: 5, minScore: 800, src: '/plant/my-wordlist.png' },
  { level: 6, minScore: 2000, src: '/plant/my-wordlist.png' },
  { level: 7, minScore: 5000, src: '/plant/my-wordlist.png' },
  { level: 8, minScore: 10000, src: '/plant/my-wordlist.png' },
]

export const LOGIN_WEIGHT = 3
export const GROWTH_HEADING = '単語を覚えると\n鉢植えが育ちます'

export function formatLevelLabel(level: number): string {
  return `Lv.${String(level).padStart(2, '0')}`
}

export function calcScore(quizCount: number, loginDays: number): number {
  return quizCount + loginDays * LOGIN_WEIGHT
}

export function resolveGrowth(quizCount: number, loginDays: number) {
  const score = calcScore(quizCount, loginDays)
  let current = PLANT_LEVELS[0]
  for (const lv of PLANT_LEVELS) {
    if (score >= lv.minScore) current = lv
  }
  const next = PLANT_LEVELS.find((lv) => lv.minScore > score) ?? null
  const scoreToNext = next ? next.minScore - score : null
  // 進捗バーの現Lv内の進み具合 (0..1)
  const progressRatio = next
    ? (score - current.minScore) / (next.minScore - current.minScore)
    : 1

  return {
    score,
    current,
    next,
    scoreToNext,
    quizzesToNext: scoreToNext, // 1クイズ = 1pt なのでそのまま
    progressRatio,
  }
}

export function getPlantImageSrc(quizCount: number, loginDays: number): string {
  return resolveGrowth(quizCount, loginDays).current.src
}
