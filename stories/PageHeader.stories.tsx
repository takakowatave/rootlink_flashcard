import type { Meta, StoryObj } from '@storybook/react'
import PageHeader from '../app/components/PageHeader'

const meta: Meta<typeof PageHeader> = {
  title: 'Design System/PageHeader',
  component: PageHeader,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof PageHeader>

export const TwoLevels: Story = {
  args: {
    items: [
      { label: 'ホーム', href: '/' },
      { label: 'My単語帳' },
    ],
  },
}

export const ThreeLevels: Story = {
  args: {
    items: [
      { label: 'ホーム', href: '/' },
      { label: '教材一覧', href: '/decks' },
      { label: 'TOEIC 頻出400語' },
    ],
  },
}
