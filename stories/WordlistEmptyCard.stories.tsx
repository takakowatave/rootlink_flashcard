import type { Meta, StoryObj } from '@storybook/react'
import WordlistEmptyCard from '../app/components/WordlistEmptyCard'

const meta: Meta<typeof WordlistEmptyCard> = {
  title: 'Dashboard/WordlistEmptyCard',
  component: WordlistEmptyCard,
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof WordlistEmptyCard>

export const Default: Story = {
  render: () => (
    <div className="max-w-[812px] p-4 bg-surface">
      <WordlistEmptyCard onClick={() => alert('open search modal')} />
    </div>
  ),
}

export const InSection: Story = {
  render: () => (
    <div className="max-w-[812px] p-4 bg-surface flex flex-col gap-3">
      <h2 className="text-xl font-bold text-gray-950">My単語帳</h2>
      <WordlistEmptyCard onClick={() => alert('open search modal')} />
    </div>
  ),
}
