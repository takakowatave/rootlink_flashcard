import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import {
  OnboardingQuestionsView,
  type EnglishLevel,
  type AcquisitionSource,
  type Expectation,
  type ReminderSlot,
} from '../app/components/OnboardingQuestions'

const meta: Meta<typeof OnboardingQuestionsView> = {
  title: 'Onboarding/OnboardingQuestions',
  component: OnboardingQuestionsView,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof OnboardingQuestionsView>

type Step = 1 | 2 | 3 | 4 | 5

const DEFAULT_REMINDERS: ReminderSlot[] = [
  { key: 'morning', label: '起床時', time: '07:00', enabled: true },
  { key: 'lunch', label: 'お昼休み', time: '12:00', enabled: false },
  { key: 'night', label: '寝る前', time: '20:00', enabled: false },
]

function Interactive({
  initialStep = 1 as Step,
  initialLevel = null as EnglishLevel | null,
  initialSource = null as AcquisitionSource | null,
  initialExpectation = null as Expectation | null,
  showReminders = false,
}) {
  const totalSteps = showReminders ? 5 : 4
  const [step, setStep] = useState<Step>(initialStep)
  const [level, setLevel] = useState<EnglishLevel | null>(initialLevel)
  const [source, setSource] = useState<AcquisitionSource | null>(initialSource)
  const [expectation, setExpectation] = useState<Expectation | null>(initialExpectation)
  const [reminders, setReminders] = useState<ReminderSlot[]>(DEFAULT_REMINDERS)

  return (
    <OnboardingQuestionsView
      step={step}
      totalSteps={totalSteps}
      showReminders={showReminders}
      level={level}
      source={source}
      expectation={expectation}
      reminders={reminders}
      onLevelChange={setLevel}
      onSourceChange={setSource}
      onExpectationChange={setExpectation}
      onReminderChange={(key, patch) =>
        setReminders((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
      }
      onReminderAdd={() => alert('スロット追加 (story では実装なし)')}
      onReminderDelete={() => alert('スロット削除 (story では実装なし)')}
      onNext={() => setStep((s) => (s < totalSteps ? ((s + 1) as Step) : s))}
      onBack={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
      onSubmit={() => alert(`保存: level=${level} source=${source} expectation=${expectation}`)}
    />
  )
}

// OnboardingQuestions は overlay 内の 1..5 を step として受け取るが、
// 進捗バーに出る数字はオンボーディング全体の通し番号 (4..8) に変換される
// (lib/onboardingSteps.ts / toGlobalOnboardingStep)。
//   step=1 (Level)       → 進捗 4 / 8
//   step=2 (Expectation) → 進捗 5 / 8
//   step=3 (Source)      → 進捗 6 / 8
//   step=4 (Reminders)   → 進捗 7 / 8  (showReminders=true のみ)
//   step=5 (Complete)    → 進捗 8 / 8  (showReminders=false なら step=4 で 8)

// Web (4-step: Level → Expectation → Source → Complete)
export const Step1Level: Story = { render: () => <Interactive initialStep={1} /> }
export const Step2Expectation: Story = {
  render: () => <Interactive initialStep={2} initialLevel="b2" />,
}
export const Step3Source: Story = {
  render: () => <Interactive initialStep={3} initialLevel="b2" initialExpectation="dictionary" />,
}
// Web 版の Complete は overlay 内 step=4 (showReminders=false のため Reminders を飛ばす)
export const Step4Complete: Story = {
  render: () => (
    <Interactive initialStep={4} initialLevel="b2" initialSource="search" initialExpectation="dictionary" />
  ),
}

// Native (5-step: adds Reminders as step 4, Complete は step 5)
export const NativeStep4Reminders: Story = {
  render: () => (
    <Interactive
      initialStep={4}
      initialLevel="b2"
      initialSource="search"
      initialExpectation="dictionary"
      showReminders
    />
  ),
}
export const NativeStep5Complete: Story = {
  render: () => (
    <Interactive
      initialStep={5}
      initialLevel="b2"
      initialSource="search"
      initialExpectation="dictionary"
      showReminders
    />
  ),
}

export const Saving: Story = {
  args: {
    step: 5,
    totalSteps: 5,
    showReminders: false,
    level: 'b2',
    source: 'search',
    expectation: 'dictionary',
    reminders: DEFAULT_REMINDERS,
    saving: true,
    onLevelChange: () => {},
    onSourceChange: () => {},
    onExpectationChange: () => {},
    onReminderChange: () => {},
    onReminderAdd: () => {},
    onReminderDelete: () => {},
    onNext: () => {},
    onBack: () => {},
    onSubmit: () => {},
  },
}
