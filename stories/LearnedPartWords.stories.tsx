import type { Meta, StoryObj } from '@storybook/react'
import { LearnedPartWordsView, type LearnedPartGroup } from '../app/components/LearnedPartWords'

// 本体の LearnedPartWords は supabase.auth.getUser() 起点で学習履歴を引く。
// Storybook では描画部だけを LearnedPartWordsView で切り出して見た目を確認する。

const meta: Meta<typeof LearnedPartWordsView> = {
  title: 'Word Detail/LearnedPartWords',
  component: LearnedPartWordsView,
  parameters: { layout: 'padded' },
  argTypes: { onSelectWord: { action: 'select-word' } },
}
export default meta

type Story = StoryObj<typeof LearnedPartWordsView>

const comGroup: LearnedPartGroup = {
  part: { text: 'com', partType: 'prefix', meaning: 'together', meaningJa: '共に', relatedWords: [], order: 0 },
  words: [
    { word: 'component', pos: 'noun', meaningJa: 'より大きなものの一部、特に機械や車両の部品', isSaved: true },
    { word: 'company', pos: 'noun', meaningJa: '商品やサービスを売る事業体', isSaved: false },
    { word: 'combat', pos: 'noun', meaningJa: '戦闘', isSaved: false },
  ],
}

const ponGroup: LearnedPartGroup = {
  part: { text: 'pon', partType: 'root', meaning: 'to put', meaningJa: '置く', relatedWords: [], order: 1 },
  words: [
    { word: 'position', pos: 'noun', meaningJa: '位置、立場', isSaved: true },
    { word: 'opponent', pos: 'noun', meaningJa: '相手、対戦者', isSaved: true },
  ],
}

export const SingleGroup: Story = {
  name: '1パーツ (com)',
  args: {
    groups: [comGroup],
  },
}

export const TwoGroups: Story = {
  name: '2パーツ (com + pon)',
  args: {
    groups: [comGroup, ponGroup],
  },
}

export const OneCardOnly: Story = {
  name: '1件のみ',
  args: {
    groups: [{
      part: comGroup.part,
      words: [comGroup.words[0]],
    }],
  },
}

export const Empty: Story = {
  name: '空 (何も描画されない)',
  args: {
    groups: [],
  },
}
