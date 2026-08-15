import type { Meta, StoryObj } from '@storybook/react'
import LexicalUnitCard from '../app/components/LexicalUnitCard'
import type { LexicalUnit } from '../app/types/LexicalUnit'

const meta: Meta<typeof LexicalUnitCard> = {
  title: 'Word Detail/LexicalUnitCard',
  component: LexicalUnitCard,
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

type Story = StoryObj<typeof LexicalUnitCard>

const baseUnit: LexicalUnit = {
  phrase: 'shove off',
  meanings: [
    {
      id: 1,
      meaning: { en: 'to leave, especially in a boat', ja: '出発する、立ち去る' },
      examples: [
        { sentence: 'They shoved off from the pier at dawn.', translation: '彼らは夜明けに桟橋を離れた。' },
      ],
    },
  ],
}

export const Default: Story = {
  args: {
    lexicalUnit: baseUnit,
    isSaved: false,
    onSave: () => {},
  },
}

export const Saved: Story = {
  args: {
    lexicalUnit: baseUnit,
    isSaved: true,
    onSave: () => {},
  },
}

export const WithoutSaveButton: Story = {
  args: {
    lexicalUnit: baseUnit,
    isSaved: false,
  },
}

export const MeaningOnly: Story = {
  args: {
    lexicalUnit: {
      phrase: 'kick the bucket',
      meanings: [
        {
          id: 1,
          meaning: { en: 'to die (informal)', ja: 'くたばる、死ぬ（口語）' },
          examples: [],
        },
      ],
    },
    isSaved: false,
    onSave: () => {},
  },
}
