import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import DeckClient from '../../DeckClient'
import { getDeck, getChapterEntriesSSR, UUID_RE, type DeckRow } from '../../deckSsr'
import { chapterCount } from '@/lib/chapters'

function canonicalPath(deck: DeckRow, chapter: number): string {
  return `/decks/${deck.slug ?? deck.id}/chapters/${chapter}`
}

function parseChapter(v: string): number | null {
  const n = Number(v)
  if (!Number.isInteger(n) || n < 1) return null
  return n
}

export async function generateMetadata({ params }: { params: { id: string; chapter: string } }): Promise<Metadata> {
  const deck = await getDeck(params.id)
  const chapter = parseChapter(params.chapter)
  if (!deck || chapter == null) return { title: 'RootLink' }
  const label = `Chapter ${String(chapter).padStart(2, '0')}`
  const title = `${deck.name} ${label}｜RootLink`
  return {
    title,
    alternates: { canonical: canonicalPath(deck, chapter) },
    robots: deck.is_official ? undefined : { index: false, follow: true },
  }
}

export default async function ChapterPage({ params }: { params: { id: string; chapter: string } }) {
  const deck = await getDeck(params.id)
  const chapter = parseChapter(params.chapter)
  if (!deck || chapter == null) notFound()

  if (UUID_RE.test(params.id) && deck.slug) {
    permanentRedirect(canonicalPath(deck, chapter))
  }

  const initialEntries = await getChapterEntriesSSR(deck.id, chapter)
  const total = chapterCount(initialEntries.length)
  if (chapter > total) notFound()

  return (
    <DeckClient
      deck={{
        id: deck.id,
        slug: deck.slug,
        name: deck.name,
        label: deck.label,
        description: deck.description,
        is_premium: deck.is_premium,
      }}
      initialEntries={initialEntries}
      chapter={chapter}
    />
  )
}
