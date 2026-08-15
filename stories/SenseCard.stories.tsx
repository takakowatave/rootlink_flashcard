import type { Meta, StoryObj } from '@storybook/react'
import SenseCard from '../app/components/SenseCard'

const meta: Meta<typeof SenseCard> = {
  title: 'Word Detail/SenseCard',
  component: SenseCard,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="max-w-[640px]">
        <Story />
      </div>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof SenseCard>

export const Basic: Story = {
  args: {
    senseIndex: 0,
    sense: {
      meaning: 'to push (someone or something) with a rough, quick movement',
      example: 'She shoved him aside and marched into the room.',
    },
  },
}

export const WithPatternAndTags: Story = {
  args: {
    senseIndex: 0,
    sense: {
      pattern: 'shove sth into sth',
      meaning: 'push something quickly and roughly into a place',
      example: 'He shoved the letter into his pocket.',
      patterns: ['with object', 'with adverbial'],
    },
  },
}

export const SavedWithTagsReadonly: Story = {
  args: {
    senseIndex: 0,
    sense: {
      saved_id: 'saved-1',
      meaning: 'to push (someone or something) with a rough, quick movement',
      example: 'She shoved him aside and marched into the room.',
      tags: ['TOEIC', '必修'],
    },
    isEditing: false,
    allTags: ['TOEIC', '必修', 'IELTS'],
  },
}

export const SavedEditingTags: Story = {
  args: {
    senseIndex: 0,
    sense: {
      saved_id: 'saved-1',
      meaning: 'to push (someone or something) with a rough, quick movement',
      example: 'She shoved him aside and marched into the room.',
      tags: ['TOEIC'],
    },
    isEditing: true,
    allTags: ['TOEIC', '必修', 'IELTS'],
    onFinishEdit: () => {},
  },
}
