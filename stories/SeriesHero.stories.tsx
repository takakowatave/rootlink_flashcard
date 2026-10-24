import type { Meta, StoryObj } from '@storybook/react'
import SeriesHero from '../app/components/SeriesHero'
import { BLOG_AUTHORS } from '../app/lib/blogAuthor'

const meta: Meta<typeof SeriesHero> = {
  title: 'Design System/SeriesHero',
  component: SeriesHero,
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof SeriesHero>

export const CuppaEnglish: Story = { args: { author: BLOG_AUTHORS['cuppa-english'] } }
