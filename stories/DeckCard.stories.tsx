import type { Meta, StoryObj } from '@storybook/react'
import DeckCard from '../app/components/DeckCard'

const meta: Meta<typeof DeckCard> = {
  title: 'Design System/DeckCard',
  component: DeckCard,
  parameters: { layout: 'centered' },
  argTypes: {
    onClick: { action: 'click' },
  },
  decorators: [
    (Story) => (
      <div className="w-[200px]">
        <Story />
      </div>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof DeckCard>

export const TOEIC_600: Story = {
  args: {
    label: 'TOEIC',
    title: '600',
    imageSrc: '/deck-covers/toeic-600.png',
  },
}

export const TOEIC_730: Story = {
  args: {
    label: 'TOEIC',
    title: '730',
    imageSrc: '/deck-covers/toeic-730.png',
  },
}

export const TOEIC_860: Story = {
  args: {
    label: 'TOEIC',
    title: '860',
    imageSrc: '/deck-covers/toeic-860.png',
  },
}

export const TOEIC_990: Story = {
  args: {
    label: 'TOEIC',
    title: '990',
    imageSrc: '/deck-covers/toeic-990.png',
  },
}

export const NoImage: Story = {
  name: 'No image (IELTS/TOEFL/英検 placeholder state)',
  args: {
    label: 'IELTS',
    title: '5.5',
  },
}
