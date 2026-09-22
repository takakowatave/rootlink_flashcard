import type { Meta, StoryObj } from '@storybook/react'
import WordCheckList from '../app/components/blog/WordCheckList'

const meta: Meta<typeof WordCheckList> = {
  title: 'Blog/WordCheckList',
  component: WordCheckList,
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof WordCheckList>

export const TwoWords: Story = { args: { words: ['farther', 'further'] } }
export const ThreeWords: Story = { args: { words: ['electric', 'electrical', 'electronic'] } }
