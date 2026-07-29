import type { Meta, StoryObj } from '@storybook/react'
import PlantStatus from '../app/components/PlantStatus'

const meta: Meta<typeof PlantStatus> = {
  title: 'Design System/PlantStatus',
  component: PlantStatus,
  parameters: { layout: 'centered' },
  argTypes: {
    quizCount: { control: { type: 'number', min: 0, max: 5000 } },
    loginDays: { control: { type: 'number', min: 0, max: 500 } },
    variant: { control: { type: 'radio' }, options: ['default', 'compact'] },
  },
}
export default meta

type Story = StoryObj<typeof PlantStatus>

// score = quiz + login*3
export const Lv1: Story = { args: { quizCount: 0, loginDays: 0 } }
export const Lv2: Story = { args: { quizCount: 20, loginDays: 4 } } // 32
export const Lv3: Story = { args: { quizCount: 80, loginDays: 8 } } // 104
export const Lv4: Story = { args: { quizCount: 250, loginDays: 20 } } // 310
export const Lv5: Story = { args: { quizCount: 700, loginDays: 40 } } // 820

export const Compact: Story = {
  args: { quizCount: 80, loginDays: 8, variant: 'compact' },
}

export const AllLevels: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      {[
        [0, 0],
        [20, 4],
        [80, 8],
        [250, 20],
        [700, 40],
      ].map(([q, d]) => (
        <div key={`${q}-${d}`} className="border border-line rounded-lg overflow-hidden">
          <PlantStatus quizCount={q} loginDays={d} />
        </div>
      ))}
    </div>
  ),
}
