import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import {
  OnboardingQuestionsView,
  type EnglishLevel,
  type AcquisitionSource,
  type Expectation,
} from '../app/components/OnboardingQuestions'

const meta: Meta<typeof OnboardingQuestionsView> = {
  title: 'Onboarding/OnboardingQuestions',
  component: OnboardingQuestionsView,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof OnboardingQuestionsView>

type Step = 1 | 2 | 3 | 4

function Interactive({
  initialStep = 1 as Step,
  initialLevel = null as EnglishLevel | null,
  initialSource = null as AcquisitionSource | null,
  initialExpectation = null as Expectation | null,
}) {
  const [step, setStep] = useState<Step>(initialStep)
  const [level, setLevel] = useState<EnglishLevel | null>(initialLevel)
  const [source, setSource] = useState<AcquisitionSource | null>(initialSource)
  const [expectation, setExpectation] = useState<Expectation | null>(initialExpectation)

  return (
    <OnboardingQuestionsView
      step={step}
      level={level}
      source={source}
      expectation={expectation}
      onLevelChange={setLevel}
      onSourceChange={setSource}
      onExpectationChange={setExpectation}
      onNext={() => setStep((s) => (s < 4 ? ((s + 1) as Step) : s))}
      onBack={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
      onSubmit={() => alert(`保存: level=${level} source=${source} expectation=${expectation}`)}
    />
  )
}

export const Step1Level: Story = { render: () => <Interactive initialStep={1} /> }
export const Step2Source: Story = { render: () => <Interactive initialStep={2} initialLevel="b2" /> }
export const Step3Expectation: Story = {
  render: () => <Interactive initialStep={3} initialLevel="b2" initialSource="search" />,
}
export const Step4Complete: Story = {
  render: () => (
    <Interactive initialStep={4} initialLevel="b2" initialSource="search" initialExpectation="dictionary" />
  ),
}
export const Saving: Story = {
  args: {
    step: 4,
    level: 'b2',
    source: 'search',
    expectation: 'dictionary',
    saving: true,
    onLevelChange: () => {},
    onSourceChange: () => {},
    onExpectationChange: () => {},
    onNext: () => {},
    onBack: () => {},
    onSubmit: () => {},
  },
}
