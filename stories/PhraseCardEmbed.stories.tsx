import type { Meta, StoryObj } from '@storybook/react'
import PhraseCardEmbed from '../app/components/PhraseCardEmbed'
import type { EmbeddedPhrase } from '../app/components/PhraseCardEmbed'

// Blog 記事中に埋め込むフレーズカード。実カードは PhraseCard.stories を参照。
// ここでは prose 内の余白・not-prose ラッパを含めた埋め込み時の見た目を確認する。

const meta: Meta<typeof PhraseCardEmbed> = {
  title: 'Word Detail/PhraseCardEmbed',
  component: PhraseCardEmbed,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <article className="prose max-w-[640px]">
        <p>本文の前段落。ここに解説が入る。</p>
        <Story />
        <p>本文の後段落。カードの上下余白を確認するためのダミーテキスト。</p>
      </article>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof PhraseCardEmbed>

const idiom: EmbeddedPhrase = {
  id: 'story-embed-1',
  phrase: 'shove off',
  meaning_ja: '立ち去る、出発する',
  meaning_en: 'to leave, especially in a boat',
  example_en: 'Shove off — I want to be alone.',
  example_ja: 'あっちへ行って。一人にしてほしいの。',
  type: 'phrasal_verb',
  register: 'neutral',
  locale: null,
  senses: null,
}

export const InArticle: Story = {
  name: 'Embedded in article (prose)',
  args: { phrase: idiom },
}
