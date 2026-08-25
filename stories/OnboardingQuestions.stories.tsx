import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import {
  OnboardingQuestionsView,
  type EnglishLevel,
  type AcquisitionSource,
  type ReminderState,
} from '../app/components/OnboardingQuestions'

const meta: Meta<typeof OnboardingQuestionsView> = {
  title: 'Onboarding/OnboardingQuestions',
  component: OnboardingQuestionsView,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof OnboardingQuestionsView>

const DEFAULT_REMINDERS: ReminderState = {
  morning: { time: '07:00', enabled: true },
  lunch: { time: '12:00', enabled: false },
  night: { time: '20:00', enabled: false },
}

type Step = 1 | 2 | 3 | 4

function Interactive({
  initialStep = 1 as Step,
  initialLevel = null as EnglishLevel | null,
  initialSource = null as AcquisitionSource | null,
}) {
  const [step, setStep] = useState<Step>(initialStep)
  const [level, setLevel] = useState<EnglishLevel | null>(initialLevel)
  const [source, setSource] = useState<AcquisitionSource | null>(initialSource)
  const [reminders, setReminders] = useState<ReminderState>(DEFAULT_REMINDERS)

  return (
    <OnboardingQuestionsView
      step={step}
      level={level}
      source={source}
      reminders={reminders}
      onLevelChange={setLevel}
      onSourceChange={setSource}
      onReminderChange={(key, patch) =>
        setReminders((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }))
      }
      onNext={() => setStep((s) => (s < 4 ? ((s + 1) as Step) : s))}
      onBack={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
      onSubmit={() => alert(`保存: level=${level} source=${source}`)}
    />
  )
}

export const Step1Level: Story = { render: () => <Interactive initialStep={1} /> }
export const Step2Source: Story = { render: () => <Interactive initialStep={2} initialLevel="b2" /> }
export const Step3Reminders: Story = {
  render: () => <Interactive initialStep={3} initialLevel="b2" initialSource="search" />,
}
export const Step4Complete: Story = {
  render: () => <Interactive initialStep={4} initialLevel="b2" initialSource="search" />,
}
export const Saving: Story = {
  args: {
    step: 4,
    level: 'b2',
    source: 'search',
    reminders: DEFAULT_REMINDERS,
    saving: true,
    onLevelChange: () => {},
    onSourceChange: () => {},
    onReminderChange: () => {},
    onNext: () => {},
    onBack: () => {},
    onSubmit: () => {},
  },
}
