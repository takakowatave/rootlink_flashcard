import type { Meta, StoryObj } from '@storybook/react'
import StreakBadge from '../app/components/StreakBadge'

const meta: Meta<typeof StreakBadge> = {
  title: 'Design System/StreakBadge',
  component: StreakBadge,
  parameters: { layout: 'centered' },
  argTypes: {
    streak: { control: { type: 'number', min: 0 } },
    longest: { control: { type: 'number', min: 0 } },
  },
}
export default meta

type Story = StoryObj<typeof StreakBadge>

export const Active: Story = { args: { streak: 7, longest: 14 } }
export const Inactive: Story = { args: { streak: 0, longest: 5 } }
export const LongStreak: Story = { args: { streak: 30, longest: 30 } }
export const NoHistory: Story = { args: { streak: 0, longest: 0 } }
