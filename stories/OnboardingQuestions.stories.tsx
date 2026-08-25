import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import {
  OnboardingQuestionsView,
  type EnglishLevel,
  type AcquisitionSource,
} from '../app/components/OnboardingQuestions'

const meta: Meta<typeof OnboardingQuestionsView> = {
  title: 'Onboarding/OnboardingQuestions',
  component: OnboardingQuestionsView,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof OnboardingQuestionsView>

type Step = 1 | 2 | 3

function Interactive({
  initialStep = 1 as Step,
  initialLevel = null as EnglishLevel | null,
  initialSource = null as AcquisitionSource | null,
}) {
  const [step, setStep] = useState<Step>(initialStep)
  const [level, setLevel] = useState<EnglishLevel | null>(initialLevel)
  const [source, setSource] = useState<AcquisitionSource | null>(initialSource)

  return (
    <OnboardingQuestionsView
      step={step}
      level={level}
      source={source}
      onLevelChange={setLevel}
      onSourceChange={setSource}
      onNext={() => setStep((s) => (s < 3 ? ((s + 1) as Step) : s))}
      onBack={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
      onSubmit={() => alert(`保存: level=${level} source=${source}`)}
    />
  )
}

export const Step1Level: Story = { render: () => <Interactive initialStep={1} /> }
export const Step2Source: Story = { render: () => <Interactive initialStep={2} initialLevel="b2" /> }
export const Step3Complete: Story = {
  render: () => <Interactive initialStep={3} initialLevel="b2" initialSource="search" />,
}
export const Saving: Story = {
  args: {
    step: 3,
    level: 'b2',
    source: 'search',
    saving: true,
    onLevelChange: () => {},
    onSourceChange: () => {},
    onNext: () => {},
    onBack: () => {},
    onSubmit: () => {},
  },
}
