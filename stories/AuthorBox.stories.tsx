import type { Meta, StoryObj } from '@storybook/react'
import AuthorBox from '../app/components/AuthorBox'
import { BLOG_AUTHOR } from '../app/lib/blogAuthor'

const meta: Meta<typeof AuthorBox> = {
  title: 'Design System/AuthorBox',
  component: AuthorBox,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[640px]">
        <Story />
      </div>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof AuthorBox>

export const Default: Story = {
  args: { author: BLOG_AUTHOR },
}
