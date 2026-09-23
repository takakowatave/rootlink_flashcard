import type { Meta, StoryObj } from '@storybook/react'
import ExampleBlock from '../app/components/blog/ExampleBlock'
import { getHighlightTerms } from '../app/lib/blogHighlights'

const meta: Meta<typeof ExampleBlock> = {
  title: 'Blog/ExampleBlock（ハイライトあり）',
  component: ExampleBlock,
  parameters: { layout: 'padded' },
  decorators: [(Story) => <div className="max-w-[640px]"><Story /></div>],
}
export default meta

export const Electric: StoryObj<typeof ExampleBlock> = {
  args: {
    terms: getHighlightTerms('electric-vs-electrical'),
    lines: ['My brother works as an electrical engineer.', '兄は電気技師として働いている。'],
  },
}
