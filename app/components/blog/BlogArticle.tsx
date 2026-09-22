import type { ReactNode } from 'react'
import Link from 'next/link'
import BlogContent from '@/blog/BlogContent'
import Button from '@/components/Button'
import AuthorBox from '@/components/AuthorBox'
import BlogProse from '@/components/blog/BlogProse'
import { BlogDate, BlogMetaText, BlogTagList } from '@/components/blog/BlogMeta'
import type { Heading, Post } from '@/lib/blog'
import type { BlogAuthor } from '@/lib/blogAuthor'
import type { EmbeddedPhrase } from '@/components/PhraseCardEmbed'
import type { SavedWordDictionary } from '@/types/Dictionary'

type AdjacentPost = { slug: string; title: string } | null

type Props = {
  post: Pick<Post, 'title' | 'tags' | 'hero_image_url' | 'content'>
  displayDate: string
  headings: Heading[]
  phraseMap: Record<string, EmbeddedPhrase>
  wordCardMap: Record<string, SavedWordDictionary | null>
  author: BlogAuthor
  prev?: AdjacentPost
  next?: AdjacentPost
  // 日付の横に出す注記（プレビューの「下書き・未公開」など）
  dateNote?: ReactNode
}

// 記事ページとプレビューページの共通レイアウト
export default function BlogArticle({
  post,
  displayDate,
  headings,
  phraseMap,
  wordCardMap,
  author,
  prev = null,
  next = null,
  dateNote,
}: Props) {
  return (
    <article>
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        {post.hero_image_url && (
          <div className="aspect-[1200/630] w-full overflow-hidden bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.hero_image_url} alt={post.title} className="h-full w-full object-cover" />
          </div>
        )}

        <div className="px-5 py-8 sm:px-8 sm:py-10">
          <header className="mb-8">
            <BlogTagList tags={post.tags} className="mb-3" />
            <h1 className="text-3xl font-bold leading-tight text-gray-950">{post.title}</h1>
            <BlogDate date={displayDate} className="mt-3">
              {dateNote}
            </BlogDate>
          </header>

          {headings.length > 0 && (
            <aside className="mb-8 rounded-xl border border-line bg-surface px-5 py-4">
              <BlogMetaText className="mb-2 font-semibold">目次</BlogMetaText>
              <ul className="space-y-1 text-base">
                {headings.map((h) => (
                  <li key={h.id} style={{ paddingLeft: `${(h.level - 1) * 12}px` }}>
                    <a href={`#${h.id}`} className="text-gray-800 hover:text-primary">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </aside>
          )}

          <BlogProse>
            <BlogContent content={post.content} phraseMap={phraseMap} wordCardMap={wordCardMap} />
          </BlogProse>
        </div>
      </div>

      {/* 末尾 CTA */}
      <div className="mt-10 rounded-2xl border border-line bg-primary-subtle px-5 py-6 text-center">
        <p className="mb-3 text-base text-gray-800">気に入った表現は、RootLink に保存して復習しよう。</p>
        <Link href="/signup">
          <Button variant="primary" size="md" radius="lg">
            無料で始める
          </Button>
        </Link>
      </div>

      {/* 前後ナビ */}
      {(prev || next) && (
        <nav className="mt-10 flex items-stretch justify-between gap-3 border-t border-line pt-6">
          {prev ? (
            <Link
              href={`/blog/${prev.slug}`}
              className="flex-1 rounded-2xl border border-line bg-white px-4 py-3 text-left transition-colors hover:border-muted"
            >
              <BlogMetaText>← 前の記事</BlogMetaText>
              <p className="mt-1 line-clamp-1 text-base text-gray-800">{prev.title}</p>
            </Link>
          ) : (
            <span className="flex-1" />
          )}
          {next ? (
            <Link
              href={`/blog/${next.slug}`}
              className="flex-1 rounded-2xl border border-line bg-white px-4 py-3 text-right transition-colors hover:border-muted"
            >
              <BlogMetaText>次の記事 →</BlogMetaText>
              <p className="mt-1 line-clamp-1 text-base text-gray-800">{next.title}</p>
            </Link>
          ) : (
            <span className="flex-1" />
          )}
        </nav>
      )}

      {/* 著者 */}
      <AuthorBox author={author} className="mt-10" />
    </article>
  )
}
