import type { Meta, StoryObj } from '@storybook/react'
import QuizProgressPanel from '../app/components/QuizProgressPanel'

const meta: Meta<typeof QuizProgressPanel> = {
  title: 'Design System/QuizProgressPanel',
  component: QuizProgressPanel,
  parameters: { layout: 'padded' },
  argTypes: {
    onStart: { action: 'start-quiz' },
    onScopeChange: { action: 'scope-change' },
  },
}
export default meta

type Story = StoryObj<typeof QuizProgressPanel>

export const WordlistDefault: Story = {
  args: {
    mastered: 12,
    review: 5,
    hard: 3,
    unseen: 68,
    scopeItems: [
      { key: 'all', count: 88 },
      { key: 'unseen', count: 71 },
      { key: 'review', count: 5 },
      { key: 'hard', count: 3 },
    ],
    selectedScope: 'all',
    buttonLabel: 'はじめる',
    buttonDisabled: false,
  },
}

export const DeckWithHeader: Story = {
  args: {
    header: (
      <div>
        <span className="text-xs font-semibold text-primary bg-primary-subtle px-2 py-0.5 rounded-full">TOEIC</span>
        <h2 className="text-xl font-bold text-gray-900 mt-2">TOEIC 頻出</h2>
        <p className="text-sm text-gray-500 mt-1">TOEIC 600点レベルで頻出の重要単語を厳選。まずここから。</p>
      </div>
    ),
    mastered: 0,
    review: 0,
    hard: 0,
    unseen: 88,
    scopeItems: [
      { key: 'all', count: 88 },
      { key: 'unseen', count: 88 },
      { key: 'review', count: 0 },
      { key: 'hard', count: 0 },
    ],
    selectedScope: 'all',
    buttonLabel: 'はじめる',
    buttonDisabled: false,
  },
}

export const PremiumLocked: Story = {
  args: {
    header: (
      <div>
        <span className="text-xs font-semibold text-primary bg-primary-subtle px-2 py-0.5 rounded-full">TOEIC</span>
        <h2 className="text-xl font-bold text-gray-900 mt-2">TOEIC 860+</h2>
        <p className="text-sm text-gray-500 mt-1">上級者向け。プレミアム限定。</p>
      </div>
    ),
    mastered: 0,
    review: 0,
    hard: 0,
    unseen: 100,
    scopeItems: [
      { key: 'all', count: 100 },
      { key: 'unseen', count: 100 },
      { key: 'review', count: 0 },
      { key: 'hard', count: 0 },
    ],
    selectedScope: 'all',
    buttonLabel: '🔒 プレミアム登録ではじめる',
    buttonDisabled: false,
  },
}

export const NoData: Story = {
  args: {
    mastered: 0,
    review: 0,
    hard: 0,
    unseen: 0,
    buttonLabel: '単語データがまだありません',
    buttonDisabled: true,
  },
}
