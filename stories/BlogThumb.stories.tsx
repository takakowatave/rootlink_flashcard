import type { Meta, StoryObj } from '@storybook/react'
import BlogThumb from '../app/components/blog/BlogThumb'
import { BlogDate, BlogTagList } from '../app/components/blog/BlogMeta'

const meta: Meta<typeof BlogThumb> = {
  title: 'Blog/BlogThumb',
  component: BlogThumb,
  parameters: { layout: 'centered' },
}
export default meta

type Story = StoryObj<typeof BlogThumb>

// hero_image_url がない記事。自動生成のカバー画像を出す。
export const Default: Story = {
  args: { slug: 'economic-economical' },
}

// hero_image_url がある記事。そちらを優先する。
export const WithHeroImage: Story = {
  args: { slug: 'economic-economical', heroImageUrl: 'https://placehold.co/1200x630/00d5be/ffffff.png' },
}

// 一覧のカードに並べたところ。
export const InListCard: Story = {
  render: () => (
    <div className="w-[608px] rounded-2xl border border-line bg-white px-5 py-4">
      <div className="flex gap-4">
        <BlogThumb slug="economic-economical" />
        <div className="min-w-0 flex-1">
          <BlogTagList tags={['語源', '使い分け', '接尾辞', 'TOEIC']} className="mb-2" />
          <h2 className="text-lg font-semibold text-gray-950">
            economicとeconomicalの違いは？語源でひも解く使い分け
          </h2>
          <BlogDate date="2026-09-18" className="mt-2" />
        </div>
      </div>
    </div>
  ),
}
