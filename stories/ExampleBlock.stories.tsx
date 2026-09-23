import type { Meta, StoryObj } from '@storybook/react'
import ExampleBlock from '../app/components/blog/ExampleBlock'

const meta: Meta<typeof ExampleBlock> = {
  title: 'Blog/ExampleBlock',
  component: ExampleBlock,
  parameters: { layout: 'padded' },
  decorators: [(Story) => <div className="max-w-[640px]"><Story /></div>],
}
export default meta

export const Default: StoryObj<typeof ExampleBlock> = {
  args: {
    lines: ['I want to buy an electric car.', '電気自動車を買いたい。'],
  },
}
