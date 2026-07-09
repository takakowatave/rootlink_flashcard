import type { Meta, StoryObj } from '@storybook/react'
import Tag from '../app/components/Tags'

const meta: Meta<typeof Tag> = {
  title: 'Design System/Tag',
  component: Tag,
  parameters: { layout: 'centered' },
  argTypes: {
    type: { control: 'select', options: ['synonym', 'antonym'] },
  },
}
export default meta

type Story = StoryObj<typeof Tag>

export const Synonym: Story = { args: { type: 'synonym' } }
export const Antonym: Story = { args: { type: 'antonym' } }

export const Both: Story = {
  render: () => (
    <div className="flex gap-2">
      <Tag type="synonym" />
      <Tag type="antonym" />
    </div>
  ),
}
