// オンボーディング全体を 1 つのステップ一覧で管理する。
// /onboarding (ウェルカム・利用規約・アカウント名) と、
// AppShell overlay (英語レベル・用途・きっかけ・リマインダー・スタート) は
// この一覧の step id を共有する。進捗バーの分子分母、戻る/進むの判定も
// この一覧から導出する。native 専用の reminders はネイティブのみ含める。

export type OnboardingStepId =
  | 'welcome'
  | 'terms'
  | 'accountName'
  | 'englishLevel'
  | 'expectation'
  | 'source'
  | 'reminders'
  | 'complete'

const WEB_STEPS: OnboardingStepId[] = [
  'welcome',
  'terms',
  'accountName',
  'englishLevel',
  'expectation',
  'source',
  'complete',
]

const NATIVE_STEPS: OnboardingStepId[] = [
  'welcome',
  'terms',
  'accountName',
  'englishLevel',
  'expectation',
  'source',
  'reminders',
  'complete',
]

export function getOnboardingSteps(isNative: boolean): OnboardingStepId[] {
  return isNative ? NATIVE_STEPS : WEB_STEPS
}

export function getOnboardingStepIndex(
  stepId: OnboardingStepId,
  isNative: boolean,
): number {
  return getOnboardingSteps(isNative).indexOf(stepId) + 1
}

export function getOnboardingTotalSteps(isNative: boolean): number {
  return getOnboardingSteps(isNative).length
}

export function getPreviousOnboardingStepId(
  stepId: OnboardingStepId,
  isNative: boolean,
): OnboardingStepId | null {
  const steps = getOnboardingSteps(isNative)
  const idx = steps.indexOf(stepId)
  if (idx <= 0) return null
  return steps[idx - 1]
}

export function getNextOnboardingStepId(
  stepId: OnboardingStepId,
  isNative: boolean,
): OnboardingStepId | null {
  const steps = getOnboardingSteps(isNative)
  const idx = steps.indexOf(stepId)
  if (idx < 0 || idx === steps.length - 1) return null
  return steps[idx + 1]
}

// /onboarding (page.tsx) 側で扱うステップ (welcome / terms / accountName)
export const SPLASH_STEPS: OnboardingStepId[] = ['welcome', 'terms', 'accountName']
// AppShell overlay (OnboardingQuestions) で扱うステップ
export const QUESTION_STEPS: OnboardingStepId[] = [
  'englishLevel',
  'expectation',
  'source',
  'reminders',
  'complete',
]

// 旧 API との互換: 既存コードから参照されている定数は残しつつ、
// 内部では step id ベースのヘルパーを呼ぶ形に移行する。
export const ONBOARDING_TOTAL_STEPS = NATIVE_STEPS.length

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
