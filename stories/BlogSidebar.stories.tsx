import type { Meta, StoryObj } from '@storybook/react'
import BlogSidebar from '../app/components/blog/BlogSidebar'

const posts = [
  { slug: 'historic-vs-historical', title: 'historicとhistoricalの違いは？語源で見る使い分け', tags: ['語源'], published_at: '2026-09-07' },
  { slug: 'economic-vs-economical', title: 'economicとeconomicalの違いは？語源で紐解く使い分け', tags: ['語源'], published_at: '2026-09-19' },
  { slug: 'complement-vs-compliment', title: 'complementとcomplimentの違いは？語源でわかる覚え方', tags: ['語源'], published_at: '2026-09-13' },
]

const meta: Meta<typeof BlogSidebar> = {
  title: 'Blog/BlogSidebar',
  component: BlogSidebar,
  parameters: { layout: 'padded' },
  decorators: [(Story) => <div className="w-[280px]"><Story /></div>],
}
export default meta

type Story = StoryObj<typeof BlogSidebar>

const categories = [
  { tag: '語源', count: 7 },
  { tag: '使い分け', count: 7 },
  { tag: 'TOEIC', count: 7 },
  { tag: '接尾辞', count: 3 },
  { tag: '比較級', count: 1 },
]

export const Default: Story = { args: { related: posts.slice(0, 2), categories } }

export const WithBanner: Story = {
  args: {
    related: posts.slice(0, 2),
    categories,
    banner: (
      <a href="/signup" className="block bg-primary-subtle px-5 py-6 text-center text-base text-gray-800">
        バナー枠のサンプル
      </a>
    ),
  },
}
