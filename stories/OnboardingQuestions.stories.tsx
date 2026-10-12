import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import {
  OnboardingQuestionsView,
  type EnglishLevel,
  type AcquisitionSource,
  type Expectation,
  type QuestionStepId,
  type ReminderSlot,
} from '../app/components/OnboardingQuestions'
import {
  getNextOnboardingStepId,
  getPreviousOnboardingStepId,
  QUESTION_STEPS,
} from '../app/lib/onboardingSteps'

const meta: Meta<typeof OnboardingQuestionsView> = {
  title: 'Onboarding/OnboardingQuestions',
  component: OnboardingQuestionsView,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof OnboardingQuestionsView>

const DEFAULT_REMINDERS: ReminderSlot[] = [
  { key: 'morning', label: '起床時', time: '07:00', enabled: true },
  { key: 'lunch', label: 'お昼休み', time: '12:00', enabled: false },
  { key: 'night', label: '寝る前', time: '20:00', enabled: false },
]

function Interactive({
  initialStep = 'englishLevel' as QuestionStepId,
  initialLevel = null as EnglishLevel | null,
  initialSource = null as AcquisitionSource | null,
  initialExpectation = null as Expectation | null,
  isNative = false,
}) {
  const [stepId, setStepId] = useState<QuestionStepId>(initialStep)
  const [level, setLevel] = useState<EnglishLevel | null>(initialLevel)
  const [source, setSource] = useState<AcquisitionSource | null>(initialSource)
  const [expectation, setExpectation] = useState<Expectation | null>(initialExpectation)
  const [reminders, setReminders] = useState<ReminderSlot[]>(DEFAULT_REMINDERS)

  return (
    <OnboardingQuestionsView
      stepId={stepId}
      isNative={isNative}
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
      onNext={() => {
        const next = getNextOnboardingStepId(stepId, isNative)
        if (next && QUESTION_STEPS.includes(next as QuestionStepId)) {
          setStepId(next as QuestionStepId)
        }
      }}
      onBack={() => {
        const prev = getPreviousOnboardingStepId(stepId, isNative)
        if (prev && QUESTION_STEPS.includes(prev as QuestionStepId)) {
          setStepId(prev as QuestionStepId)
        }
      }}
      onSubmit={() => alert(`保存: level=${level} source=${source} expectation=${expectation}`)}
    />
  )
}

// オンボーディング全体の通し番号 (onboardingSteps.ts) で進捗バーが決まる:
//   englishLevel → 4 / 8 (native) または 4 / 7 (web)
//   expectation  → 5 / 8 (native) または 5 / 7 (web)
//   source       → 6 / 8 (native) または 6 / 7 (web)
//   reminders    → 7 / 8 (native のみ)
//   complete     → 8 / 8 (native) または 7 / 7 (web)

export const Step1Level: Story = { render: () => <Interactive initialStep="englishLevel" /> }
export const Step2Expectation: Story = {
  render: () => <Interactive initialStep="expectation" initialLevel="b2" />,
}
export const Step3Source: Story = {
  render: () => <Interactive initialStep="source" initialLevel="b2" initialExpectation="dictionary" />,
}
export const Step4Complete: Story = {
  render: () => (
    <Interactive initialStep="complete" initialLevel="b2" initialSource="search" initialExpectation="dictionary" />
  ),
}

export const NativeStep4Reminders: Story = {
  render: () => (
    <Interactive
      initialStep="reminders"
      initialLevel="b2"
      initialSource="search"
      initialExpectation="dictionary"
      isNative
    />
  ),
}
export const NativeStep5Complete: Story = {
  render: () => (
    <Interactive
      initialStep="complete"
      initialLevel="b2"
      initialSource="search"
      initialExpectation="dictionary"
      isNative
    />
  ),
}

export const Saving: Story = {
  args: {
    stepId: 'complete',
    isNative: false,
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
