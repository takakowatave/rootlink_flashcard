import type { Meta, StoryObj } from '@storybook/react'
import EtymologyPartBadge from '../app/components/EtymologyPartBadge'

const meta: Meta<typeof EtymologyPartBadge> = {
  title: 'Design System/EtymologyPartBadge',
  component: EtymologyPartBadge,
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof EtymologyPartBadge>

export const WithGloss: Story = {
  args: { partText: 'as', gloss: '〜へ（変化を表す）' },
}

export const WithoutGloss: Story = {
  args: { partText: 'phon' },
}
