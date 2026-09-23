import type { Meta, StoryObj } from '@storybook/react'
import { BlogDate, BlogMetaText, BlogTagList } from '../app/components/blog/BlogMeta'

const meta: Meta = {
  title: 'Blog/BlogMeta',
  parameters: { layout: 'centered' },
}
export default meta

export const All: StoryObj = {
  render: () => (
    <div className="w-[480px] space-y-4">
      <BlogTagList tags={['語源', '使い分け', '接尾辞', 'TOEIC']} />
      <BlogDate date="2026-09-22" />
      <BlogMetaText>この記事を書いた人</BlogMetaText>
    </div>
  ),
}
