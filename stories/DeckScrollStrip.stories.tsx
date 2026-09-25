import type { Meta, StoryObj } from '@storybook/react'
import DeckScrollStrip from '../app/components/DeckScrollStrip'

const meta: Meta<typeof DeckScrollStrip> = {
  title: 'Design System/DeckScrollStrip',
  component: DeckScrollStrip,
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof DeckScrollStrip>

const items = [
  { key: 'toeic-600', label: 'TOEIC', title: '600', imageSrc: '/deck-covers/toeic-600.png', wordCount: 480, href: '/decks/toeic-600' },
  { key: 'toeic-730', label: 'TOEIC', title: '730', imageSrc: '/deck-covers/toeic-730.png', wordCount: 379, href: '/decks/toeic-730' },
  { key: 'toeic-860', label: 'TOEIC', title: '860', imageSrc: '/deck-covers/toeic-860.png', wordCount: 292, href: '/decks/toeic-860' },
  { key: 'toeic-990', label: 'TOEIC', title: '990', imageSrc: '/deck-covers/toeic-990.png', wordCount: 191, href: '/decks/toeic-990' },
]

export const TOEIC: Story = { args: { label: 'TOEIC', items } }

export const WithoutLabel: Story = { args: { items } }
