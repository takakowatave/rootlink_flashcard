import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import DeckClient from './DeckClient'
import { toShortName } from '@/lib/deckDisplay'
import { getDeck, getDeckWordsMetaSSR, UUID_RE, type DeckRow } from './deckSsr'

function buildTitleHead(label: string, shortName: string): string {
  if (label === 'TOEIC') return shortName === '頻出' ? 'TOEIC 頻出' : `TOEIC ${shortName}点`
  if (label === '英検') return `英検${shortName}`
  return `${label} ${shortName}`
}

function canonicalPath(deck: DeckRow): string {
  return `/decks/${deck.slug ?? deck.id}`
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const deck = await getDeck(params.id)
  if (!deck) return { title: 'RootLink' }

  const shortName = toShortName(deck.name, deck.label)
  const head = buildTitleHead(deck.label, shortName)
  const title = `${head}の英単語${deck.word_count}語｜語源で覚える`
  const shareTitle = `${title} | RootLink`
  const description =
    deck.description ??
    `${head}レベルの重要英単語${deck.word_count}語を、語源から理解して定着させる単語帳。`

  const meta: Metadata = {
    title,
    description,
    alternates: { canonical: canonicalPath(deck) },
    openGraph: { title: shareTitle, description, type: 'website' },
    twitter: { card: 'summary', title: shareTitle, description },
  }
  if (!deck.is_official) {
    meta.robots = { index: false, follow: true }
  }
  return meta
}

export default async function DeckPage({ params }: { params: { id: string } }) {
  const deck = await getDeck(params.id)
  if (!deck) notFound()

  // 旧 /decks/{uuid} は /decks/{slug} へ 308 リダイレクト
  if (UUID_RE.test(params.id) && deck.slug) {
    permanentRedirect(`/decks/${deck.slug}`)
  }

  // デッキ画面は dictionary_cache を読まない (章一覧 / 進捗グラフ / 前回の続きに不要)。
  // 章に入ったときだけ、その章の 50 語ぶんの辞書を読む。
  const initialEntries = await getDeckWordsMetaSSR(deck.id)

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
    />
  )
}
