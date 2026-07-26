import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import QuizScopeSelector, { type QuizScope } from '../app/components/QuizScopeSelector'

const meta: Meta<typeof QuizScopeSelector> = {
  title: 'Quiz/QuizScopeSelector',
  component: QuizScopeSelector,
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof QuizScopeSelector>

function Interactive({ initial = 'all' as QuizScope }) {
  const [scope, setScope] = useState<QuizScope>(initial)
  return (
    <div className="max-w-[500px] p-4 bg-white">
      <QuizScopeSelector
        items={[
          { key: 'all', count: 120 },
          { key: 'unseen', count: 81 },
          { key: 'review', count: 12 },
          { key: 'hard', count: 3 },
        ]}
        selected={scope}
        onChange={setScope}
      />
      <p className="mt-4 text-sm text-gray-500">selected: <code>{scope}</code></p>
    </div>
  )
}

export const Default: Story = { render: () => <Interactive /> }

export const HardSelected: Story = { render: () => <Interactive initial="hard" /> }

export const WithEmptyStates: Story = {
  render: () => {
    const [scope, setScope] = useState<QuizScope>('all')
    return (
      <div className="max-w-[500px] p-4 bg-white">
        <QuizScopeSelector
          items={[
            { key: 'all', count: 30 },
            { key: 'unseen', count: 30 },
            { key: 'review', count: 0 },
            { key: 'hard', count: 0 },
          ]}
          selected={scope}
          onChange={setScope}
        />
      </div>
    )
  },
}
