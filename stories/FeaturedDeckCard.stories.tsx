import type { Meta, StoryObj } from '@storybook/react'
import FeaturedDeckCard from '../app/components/FeaturedDeckCard'

const meta: Meta<typeof FeaturedDeckCard> = {
  title: 'Design System/FeaturedDeckCard',
  component: FeaturedDeckCard,
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof FeaturedDeckCard>

export const CuppaEnglish: Story = {
  args: {
    title: 'Cuppa English｜イギリス英語の会話表現',
    description: 'イギリス英語をフラッシュカード形式で覚えられます',
    imageSrc: '/authors/cuppa-english.webp',
    href: '/decks/cuppa-british-english',
    countLabel: '6表現',
  },
}
