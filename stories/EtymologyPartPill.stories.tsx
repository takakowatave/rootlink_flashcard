import type { Meta, StoryObj } from '@storybook/react'
import EtymologyPartPill from '../app/components/EtymologyPartPill'

const meta: Meta<typeof EtymologyPartPill> = {
  title: 'Design System/EtymologyPartPill',
  component: EtymologyPartPill,
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof EtymologyPartPill>

export const Short: Story = { args: { partText: 'as' } }
export const Medium: Story = { args: { partText: 'phon' } }
export const Long: Story = { args: { partText: 'sembl' } }
