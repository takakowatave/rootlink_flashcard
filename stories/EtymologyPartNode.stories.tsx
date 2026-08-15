import type { Meta, StoryObj } from '@storybook/react'
import EtymologyPartNode from '../app/components/EtymologyPartNode'

// 実際の関連語リストは Supabase (etymology_part_words) から取得。
// Storybook 上では取得に失敗しても静かに空配列になり、展開ボタン非表示になる。
// カード自体の見た目（partText / meaning バッジ）はここで確認できる。

const meta: Meta<typeof EtymologyPartNode> = {
  title: 'Word Detail/EtymologyPartNode',
  component: EtymologyPartNode,
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof EtymologyPartNode>

export const Root: Story = {
  name: 'ラテン語根 (spect)',
  args: {
    partText: 'spect',
    meaning: 'to look',
    headword: 'inspect',
  },
}

export const Prefix: Story = {
  name: '接頭辞 (in-)',
  args: {
    partText: 'in-',
    meaning: 'into',
    headword: 'inspect',
  },
}

export const Suffix: Story = {
  name: '接尾辞 (-tion)',
  args: {
    partText: '-tion',
    meaning: 'action or state',
    headword: 'inspection',
  },
}
