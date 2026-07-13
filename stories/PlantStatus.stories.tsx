import type { Meta, StoryObj } from '@storybook/react'
import PlantStatus from '../app/components/PlantStatus'

const meta: Meta<typeof PlantStatus> = {
  title: 'Design System/PlantStatus',
  component: PlantStatus,
  parameters: { layout: 'centered' },
  argTypes: {
    loginDays: { control: { type: 'number', min: 0, max: 60 } },
  },
}
export default meta

type Story = StoryObj<typeof PlantStatus>

export const Lv1: Story = { args: { loginDays: 0 } }
export const Lv2: Story = { args: { loginDays: 3 } }
export const Lv3: Story = { args: { loginDays: 7 } }
export const Lv4: Story = { args: { loginDays: 14 } }
export const Lv5: Story = { args: { loginDays: 30 } }

export const AllLevels: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      {[0, 3, 7, 14, 30].map((days) => (
        <div key={days} className="border border-line rounded-lg overflow-hidden">
          <PlantStatus loginDays={days} />
        </div>
      ))}
    </div>
  ),
}
