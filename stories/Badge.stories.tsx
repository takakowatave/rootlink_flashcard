import type { Meta, StoryObj } from '@storybook/react'
import Badge from '../app/components/Badge'

const meta: Meta<typeof Badge> = {
  title: 'Design System/Badge',
  component: Badge,
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof Badge>

export const PartOfSpeech: Story = {
  args: { children: '動詞' },
}

export const PhraseType: Story = {
  args: { children: '句動詞' },
}

export const Medium: Story = {
  args: { children: '名詞', size: 'md' },
}

export const PhraseMeta: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>句動詞</Badge>
      <Badge>イギリス英語</Badge>
      <Badge>カジュアル</Badge>
    </div>
  ),
}
