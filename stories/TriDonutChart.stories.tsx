import type { Meta, StoryObj } from '@storybook/react'
import TriDonutChart from '../app/components/TriDonutChart'

const meta: Meta<typeof TriDonutChart> = {
  title: 'Design System/TriDonutChart',
  component: TriDonutChart,
  parameters: { layout: 'centered' },
  argTypes: {
    mastered: { control: { type: 'number', min: 0 } },
    review: { control: { type: 'number', min: 0 } },
    hard: { control: { type: 'number', min: 0 } },
    unseen: { control: { type: 'number', min: 0 } },
  },
}
export default meta

type Story = StoryObj<typeof TriDonutChart>

export const Default: Story = { args: { mastered: 28, review: 12, hard: 5, unseen: 55 } }
export const AllMastered: Story = { args: { mastered: 100, review: 0, hard: 0, unseen: 0 } }
export const Fresh: Story = { args: { mastered: 0, review: 0, hard: 0, unseen: 100 } }
export const HalfWay: Story = { args: { mastered: 45, review: 15, hard: 10, unseen: 30 } }
