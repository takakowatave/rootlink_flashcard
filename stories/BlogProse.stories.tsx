import type { Meta, StoryObj } from '@storybook/react'
import BlogProse from '../app/components/blog/BlogProse'
import BlogContent from '../app/blog/BlogContent'

const SAMPLE = `farther と further。どちらも far の比較級として習いますよね。

## farther とは

- 品詞は形容詞・副詞
- 発音は /ˈfɑːrðər/

1. The station was farther than I thought.（駅は思っていたより遠かった）
2. I can't walk any farther.（もうこれ以上歩けない）

> Please contact us if you need ____ assistance.\\
> (A) farther / (B) further

本文中の [リンク](/blog) と **太字** の見え方も確認できます。`

const meta: Meta<typeof BlogProse> = {
  title: 'Blog/BlogProse',
  component: BlogProse,
  parameters: { layout: 'padded' },
}
export default meta

export const Default: StoryObj<typeof BlogProse> = {
  render: () => (
    <div className="max-w-[640px]">
      <BlogProse>
        <BlogContent content={SAMPLE} phraseMap={{}} wordCardMap={{}} />
      </BlogProse>
    </div>
  ),
}
