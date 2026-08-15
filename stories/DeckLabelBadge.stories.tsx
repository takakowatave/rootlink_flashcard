import type { Meta, StoryObj } from '@storybook/react'
import DeckLabelBadge from '../app/components/DeckLabelBadge'

const meta: Meta<typeof DeckLabelBadge> = {
  title: 'Design System/DeckLabelBadge',
  component: DeckLabelBadge,
  parameters: { layout: 'centered' },
}
export default meta

type Story = StoryObj<typeof DeckLabelBadge>

export const TOEIC: Story = { args: { label: 'TOEIC' } }
export const IELTS: Story = { args: { label: 'IELTS' } }
export const Eiken: Story = { args: { label: '英検' } }
