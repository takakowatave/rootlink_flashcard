import type { Meta, StoryObj } from '@storybook/react'
import Breadcrumb from '../app/components/Breadcrumb'

const meta: Meta<typeof Breadcrumb> = {
  title: 'Design System/Breadcrumb',
  component: Breadcrumb,
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof Breadcrumb>

export const TwoLevels: Story = {
  args: {
    items: [
      { label: 'ホーム', href: '/' },
      { label: 'オリジナル単語帳' },
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

export const LongLabel: Story = {
  args: {
    items: [
      { label: 'ホーム', href: '/' },
      { label: '教材一覧', href: '/decks' },
      { label: '大学入試 英単語ターゲット1900 改訂第5版' },
    ],
  },
}
