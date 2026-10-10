// オンボーディング全体の通し番号。/onboarding (ウェルカム・利用規約・アカウント名) と、
// その後の OnboardingQuestions overlay (英語レベル・用途・きっかけ・リマインダー・スタート)
// に跨って共通で使う。進捗バーもこの番号で表示する。
//
// Figma 2613:6938 では各画面の header に出る progress-bar がある/ないで分岐しており、
// ウェルカムと利用規約は進捗バーなし、アカウント名以降はありという指針を取る。

export const ONBOARDING_TOTAL_STEPS = 8

export const ONBOARDING_STEP = {
  welcome: 1,
  terms: 2,
  accountName: 3,
  englishLevel: 4,
  expectation: 5,
  source: 6,
  reminders: 7,
  complete: 8,
} as const

export type OnboardingStepNumber =
  (typeof ONBOARDING_STEP)[keyof typeof ONBOARDING_STEP]
