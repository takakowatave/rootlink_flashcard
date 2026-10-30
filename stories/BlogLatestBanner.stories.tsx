import type { Meta, StoryObj } from '@storybook/react'
import BlogLatestBanner from '../app/components/blog/BlogLatestBanner'

const meta: Meta<typeof BlogLatestBanner> = {
  title: 'Blog/BlogLatestBanner',
  component: BlogLatestBanner,
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof BlogLatestBanner>

const basePost = {
  slug: 'cuppa-english-ollivanders-phrases',
  title: '「Not to worry」はイギリス流の「大丈夫」。オリバンダーの店で学ぶ会話表現7選｜ハリポタで学ぶイギリス英語',
  tags: null,
  published_at: '2026-10-24T02:07:00Z',
  hero_image_url: null,
  thumb_image_url: 'https://placehold.co/1200x630/f0fdfa/00786f.png?text=OGP',
}

export const Default: Story = { args: { post: basePost } }

export const LongTitle: Story = {
  args: {
    post: {
      ...basePost,
      title: '「come to a sticky end」とは？ハグリッドが怒る場面で学ぶ会話表現7選｜ハリポタで学ぶイギリス英語（長めタイトル確認用）',
    },
  },
}

export const ShortTitle: Story = {
  args: { post: { ...basePost, title: 'ダンブルドアで覚える英語表現5選' } },
}
