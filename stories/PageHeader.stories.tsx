import type { Meta, StoryObj } from '@storybook/react'
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport'
import PageHeader from '../app/components/PageHeader'

const meta: Meta<typeof PageHeader> = {
  title: 'Design System/PageHeader',
  component: PageHeader,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof PageHeader>

/** PC: パンくずリスト表示 */
export const PC: Story = {
  args: {
    items: [
      { label: 'ホーム', href: '/' },
      { label: '教材一覧', href: '/decks' },
      { label: 'TOEIC 頻出400語' },
    ],
  },
  parameters: {
    viewport: { defaultViewport: 'responsive' },
  },
}

/** SP: sticky 戻るヘッダー (router.back()) */
export const SP: Story = {
  args: {
    items: [
      { label: 'ホーム', href: '/' },
      { label: '教材一覧', href: '/decks' },
      { label: 'TOEIC 頻出400語' },
    ],
  },
  parameters: {
    viewport: {
      viewports: INITIAL_VIEWPORTS,
      defaultViewport: 'iphone6',
    },
  },
}

/** 2 階層のパンくず (PC 表示) */
export const TwoLevels: Story = {
  args: {
    items: [
      { label: 'ホーム', href: '/' },
      { label: 'My単語帳' },
    ],
  },
}
