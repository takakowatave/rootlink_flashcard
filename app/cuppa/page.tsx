import Link from 'next/link'
import type { Metadata } from 'next'
import { BLOG_AUTHORS } from '@/lib/blogAuthor'
import { fetchPostsByAuthor } from '@/lib/blogQueries'
import { getDeck } from '@/decks/[id]/deckSsr'
import SeriesHero from '@/components/SeriesHero'
import FeaturedDeckCard from '@/components/FeaturedDeckCard'
import BlogCarousel from '@/components/blog/BlogCarousel'
import { buttonClassName } from '@/components/buttonStyles'

const AUTHOR_KEY = 'cuppa-english'
const DECK_SLUG = 'cuppa-british-english'
// 「すべて見る」の行き先。会話表現タグは Cuppa の記事だけに付いている
const ALL_POSTS_HREF = `/blog/tag/${encodeURIComponent('会話表現')}`

const author = BLOG_AUTHORS[AUTHOR_KEY]

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Cuppa English｜イギリス英語の会話表現',
  description: author.bio,
  alternates: { canonical: '/cuppa' },
  openGraph: { title: 'Cuppa English | RootLink', description: author.bio, type: 'website' },
  twitter: { card: 'summary', title: 'Cuppa English | RootLink', description: author.bio },
}

export default async function CuppaPage() {
  const [deck, posts] = await Promise.all([getDeck(DECK_SLUG), fetchPostsByAuthor(AUTHOR_KEY)])

  return (
    <main className="mx-auto flex max-w-[600px] flex-col gap-8 px-4 py-6">
      <SeriesHero author={author} />

      {deck && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-gray-950">デッキで学ぶ</h2>
          <FeaturedDeckCard
            title={deck.name}
            description="イギリス英語をフラッシュカード形式で覚えられます"
            imageSrc={author.avatarSrc}
            href={`/decks/${deck.slug ?? deck.id}`}
            countLabel={`${deck.word_count}表現`}
          />
        </section>
      )}

      {posts.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-950">ブログ</h2>
            <Link href={ALL_POSTS_HREF} className="text-sm font-medium text-primary hover:text-primary-hover">
              すべて見る →
            </Link>
          </div>
          <BlogCarousel posts={posts} />
          <Link
            href={ALL_POSTS_HREF}
            className={buttonClassName({ variant: 'secondary', size: 'lg', fullWidth: true })}
          >
            すべての記事を見る
          </Link>
        </section>
      )}
    </main>
  )
}
