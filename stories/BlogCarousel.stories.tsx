import type { Meta, StoryObj } from '@storybook/react'
import BlogCarousel from '../app/components/blog/BlogCarousel'

const meta: Meta<typeof BlogCarousel> = {
  title: 'Blog/BlogCarousel',
  component: BlogCarousel,
  parameters: { layout: 'padded', viewport: { defaultViewport: 'mobile1' } },
}
export default meta

type Story = StoryObj<typeof BlogCarousel>

const posts = [
  { slug: 'cuppa-english-dudley-birthday-phrases', title: '「get a move on」の意味は？ダドリーの誕生日に学ぶ会話表現7選｜ハリポタで学ぶイギリス英語', tags: null, published_at: '2026-10-25T10:00:00Z', hero_image_url: 'https://placehold.co/1200x630/e0f2fe/0f172a.png' },
  { slug: 'cuppa-english-dumbledore-phrases', title: 'ダンブルドア登場シーンで学ぶ会話表現6選｜ハリポタで学ぶイギリス英語', tags: null, published_at: '2026-10-20T06:00:00Z', hero_image_url: 'https://placehold.co/1200x630/f0f9ff/0f172a.png' },
  { slug: 'cuppa-english-dudley-zoo-phrases', title: '「look after」は英式の『世話をする』。ダドリーの誕生日 動物園編で学ぶ会話表現7選', tags: null, published_at: '2026-11-01T10:00:00Z', hero_image_url: 'https://placehold.co/1200x630/e0f2fe/0f172a.png' },
]

// 3枚。2枚目の右端がはみ出して見える。
export const Default: Story = { args: { posts } }

// 1枚だけのとき。
export const Single: Story = { args: { posts: posts.slice(0, 1) } }
