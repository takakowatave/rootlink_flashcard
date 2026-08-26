import type { Meta, StoryObj } from '@storybook/react'
import SavedWordRow from '../app/components/SavedWordRow'

const meta: Meta<typeof SavedWordRow> = {
  title: 'Design System/SavedWordRow',
  component: SavedWordRow,
  parameters: { layout: 'padded' },
  argTypes: {
    isSaved: { control: 'boolean' },
    onToggleSave: { action: 'toggle-save' },
  },
}
export default meta

type Story = StoryObj<typeof SavedWordRow>

export const Default: Story = {
  args: {
    word: 'assembly',
    pos: 'noun',
    meaningJa: '同じ目的の集まり',
    isSaved: false,
  },
}

export const Saved: Story = {
  args: {
    word: 'assembly',
    pos: 'noun',
    meaningJa: '同じ目的の集まり',
    isSaved: true,
  },
}

export const LongMeaning: Story = {
  args: {
    word: 'ephemeral',
    pos: 'adjective',
    meaningJa: '短命な、はかない、束の間の（非常に長い説明でtruncateされる想定のテキスト）',
    isSaved: false,
  },
}
