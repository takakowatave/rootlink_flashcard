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

type Step = 1 | 2 | 3 | 4 | 5 | 6

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
  const totalSteps = showReminders ? 6 : 5
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

// Web (5-step: Welcome → Level → Source → Expectation → Complete)
export const Step1Welcome: Story = { render: () => <Interactive initialStep={1} /> }
export const Step2Level: Story = { render: () => <Interactive initialStep={2} /> }
export const Step3Source: Story = { render: () => <Interactive initialStep={3} initialLevel="b2" /> }
export const Step4Expectation: Story = {
  render: () => <Interactive initialStep={4} initialLevel="b2" initialSource="search" />,
}
export const Step5Complete: Story = {
  render: () => (
    <Interactive initialStep={5} initialLevel="b2" initialSource="search" initialExpectation="dictionary" />
  ),
}

// Native (6-step: adds Reminders as step 5)
export const NativeStep5Reminders: Story = {
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
export const NativeStep6Complete: Story = {
  render: () => (
    <Interactive
      initialStep={6}
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
