import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import Toggle from '../app/components/Toggle'

const meta: Meta<typeof Toggle> = {
  title: 'Design System/Toggle',
  component: Toggle,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="p-8 bg-white rounded-lg">
        <Story />
      </div>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof Toggle>

export const OffToOn: Story = {
  render: () => {
    const [on, setOn] = useState(false)
    return <Toggle checked={on} onChange={setOn} label="通知" />
  },
}

export const InitiallyOn: Story = {
  render: () => {
    const [on, setOn] = useState(true)
    return <Toggle checked={on} onChange={setOn} label="通知" />
  },
}

export const Disabled: Story = {
  render: () => (
    <div className="flex gap-6">
      <Toggle checked={false} onChange={() => {}} label="通知 OFF disabled" disabled />
      <Toggle checked={true} onChange={() => {}} label="通知 ON disabled" disabled />
    </div>
  ),
}
