import type { Meta, StoryObj } from '@storybook/react'
import ChapterListItem from '../app/components/ChapterListItem'

const meta: Meta<typeof ChapterListItem> = {
  title: 'Design System/ChapterListItem',
  component: ChapterListItem,
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof ChapterListItem>

export const InProgress: Story = {
  args: { chapterNo: 1, label: 'Chapter 01', mastered: 24, total: 50 },
}

export const Untouched: Story = {
  args: { chapterNo: 4, label: 'Chapter 04', mastered: 0, total: 50 },
}

export const Complete: Story = {
  args: { chapterNo: 2, label: 'Chapter 02', mastered: 50, total: 50 },
}

export const Locked: Story = {
  args: { chapterNo: 5, label: 'Chapter 05', mastered: 0, total: 50, locked: true },
}
