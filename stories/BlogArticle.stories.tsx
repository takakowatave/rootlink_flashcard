import type { Meta, StoryObj } from '@storybook/react'
import BlogArticle from '../app/components/blog/BlogArticle'
import { BLOG_AUTHOR } from '../app/lib/blogAuthor'
import { extractHeadings } from '../app/lib/blog'

const CONTENT = `farther と further。どちらも far の比較級として習いますよね。

## farther とは

far の比較級で「もっと遠い」という意味です。

## further とは

距離以外の意味もたくさん持っています。`

const meta: Meta<typeof BlogArticle> = {
  title: 'Blog/BlogArticle',
  component: BlogArticle,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-[672px]">
        <Story />
      </div>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof BlogArticle>

export const Published: Story = {
  args: {
    post: {
      title: 'fartherとfurtherの違いは？語源で紐解くそのちがい',
      tags: ['語源', '使い分け', '比較級', 'TOEIC'],
      hero_image_url: null,
      content: CONTENT,
    },
    displayDate: '2026-09-22',
    headings: extractHeadings(CONTENT),
    phraseMap: {},
    wordCardMap: {},
    author: BLOG_AUTHOR,
    prev: { slug: 'economic-vs-economical', title: 'economicとeconomicalの違いは？語源で紐解く使い分け' },
    next: { slug: 'classic-vs-classical', title: 'classicとclassicalの違いは？クラシック音楽はどっち' },
  },
}

export const Draft: Story = {
  args: {
    ...Published.args,
    prev: null,
    next: null,
    dateNote: <span className="ml-2 text-quiz-review">（下書き・未公開）</span>,
  },
}
