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
    wordCount: 480,
  },
}

export const TOEIC_730: Story = {
  args: {
    label: 'TOEIC',
    title: '730',
    imageSrc: '/deck-covers/toeic-730.png',
    wordCount: 379,
  },
}

export const TOEIC_860: Story = {
  args: {
    label: 'TOEIC',
    title: '860',
    imageSrc: '/deck-covers/toeic-860.png',
    wordCount: 292,
  },
}

export const TOEIC_990: Story = {
  args: {
    label: 'TOEIC',
    title: '990',
    imageSrc: '/deck-covers/toeic-990.png',
    wordCount: 191,
  },
}

export const NoImage: Story = {
  name: 'No image (IELTS/TOEFL/英検 placeholder state)',
  args: {
    label: 'IELTS',
    title: '5.5',
    wordCount: 269,
  },
}

export const NoWordCount: Story = {
  name: 'No word count (オリジナル単語帳など件数非表示)',
  args: {
    title: 'オリジナル単語帳',
    imageSrc: '/plant/lv3.png',
  },
}

export const Premium: Story = {
  name: 'Premium (crown badge)',
  args: {
    label: 'IELTS',
    title: '6.5',
    imageSrc: '/deck-covers/ielts-6.5.png',
    wordCount: 342,
    isPremium: true,
  },
}

export const Disabled: Story = {
  name: 'Disabled (該当なし・0件時)',
  args: {
    title: '昨日',
    imageSrc: '/dashboard/recent-words.png',
    wordCount: 0,
    disabled: true,
  },
}

export const ReviewPeriod: Story = {
  name: 'Review period card (復習セクション)',
  args: {
    title: '1週間',
    imageSrc: '/dashboard/recent-words.png',
    wordCount: 42,
  },
}
