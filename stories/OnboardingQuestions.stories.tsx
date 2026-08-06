import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { OnboardingQuestionsView, type Expectation, type EnglishLevel } from '../app/components/OnboardingQuestions'

const meta: Meta<typeof OnboardingQuestionsView> = {
  title: 'Onboarding/OnboardingQuestions',
  component: OnboardingQuestionsView,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof OnboardingQuestionsView>

function Interactive({ initialScreen = 1 as 1 | 2, initialExpectation = null as Expectation | null }) {
  const [screen, setScreen] = useState<1 | 2>(initialScreen)
  const [expectation, setExpectation] = useState<Expectation | null>(initialExpectation)
  const [expectationOther, setExpectationOther] = useState('')
  const [level, setLevel] = useState<EnglishLevel | null>(null)
  return (
    <OnboardingQuestionsView
      screen={screen}
      expectation={expectation}
      expectationOther={expectationOther}
      level={level}
      onExpectationChange={setExpectation}
      onExpectationOtherChange={setExpectationOther}
      onLevelChange={setLevel}
      onNext={() => setScreen(2)}
      onBack={() => setScreen(1)}
      onSubmit={() => alert(`保存: expectation=${expectation} level=${level}`)}
    />
  )
}

export const Q1Empty: Story = {
  render: () => <Interactive />,
}

export const Q1OtherSelected: Story = {
  render: () => <Interactive initialExpectation="other" />,
}

export const Q2Empty: Story = {
  render: () => <Interactive initialScreen={2} initialExpectation="dictionary" />,
}

export const Saving: Story = {
  args: {
    screen: 2,
    expectation: 'exam',
    expectationOther: '',
    level: 'b2',
    saving: true,
    onExpectationChange: () => {},
    onExpectationOtherChange: () => {},
    onLevelChange: () => {},
    onNext: () => {},
    onBack: () => {},
    onSubmit: () => {},
  },
}
