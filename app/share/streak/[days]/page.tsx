import type { Metadata } from 'next'
import Link from 'next/link'

type Params = { days: string }
type Search = { lv?: string }

function parseDays(raw: string): number {
  return Math.max(0, Math.min(9999, parseInt(raw ?? '0', 10) || 0))
}

function parseLevel(raw: string | undefined): number {
  return Math.max(1, Math.min(5, parseInt(raw ?? '1', 10) || 1))
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params
  searchParams?: Search
}): Promise<Metadata> {
  const days = parseDays(params.days)
  const lv = parseLevel(searchParams?.lv)
  const cardUrl = `https://www.rootlink.app/share/streak/${days}/card.png?lv=${lv}`
  const title = `RootLink で ${days}日連続学習中`
  const description = '語源から学ぶ英単語 — RootLink'
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.rootlink.app/share/streak/${days}?lv=${lv}`,
      images: [{ url: cardUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [cardUrl],
    },
  }
}

export default function Page({
  params,
  searchParams,
}: {
  params: Params
  searchParams?: Search
}) {
  const days = parseDays(params.days)
  const lv = parseLevel(searchParams?.lv)
  const cardUrl = `/share/streak/${days}/card.png?lv=${lv}`

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 py-10 bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cardUrl}
        alt={`${days}日連続学習中`}
        className="max-w-[420px] w-full h-auto rounded-2xl shadow-lg"
      />
      <p className="text-sm text-gray-600 text-center">
        語源から学ぶ英単語 — RootLink
      </p>
      <Link
        href="/"
        className="inline-flex items-center h-11 px-6 rounded-full bg-primary text-white font-bold text-sm hover:opacity-90"
      >
        RootLink を試す
      </Link>
    </main>
  )
}
