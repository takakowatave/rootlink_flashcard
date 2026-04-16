import type { Metadata } from "next"
import WordPageClient from '@/components/WordPageClient'

const API_BASE =
  process.env.NEXT_PUBLIC_CLOUDRUN_API_URL ??
  "https://rootlink-server-v2-774622345521.asia-northeast1.run.app"

async function resolveWord(raw: string) {
  try {
    const res = await fetch(`${API_BASE}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: raw }),
      next: { revalidate: 60 * 60 * 24 }, // 24h cache
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.ok) return null
    return data
  } catch {
    return null
  }
}

function extractDescription(dictionary: Record<string, unknown> | null, word: string): string {
  if (!dictionary) return `Explore the etymology and meaning of "${word}" on RootLink.`

  // RewrittenPayload 形式: senses[0].definition
  const senses = (dictionary as { senses?: { definition?: string }[] }).senses
  if (senses?.[0]?.definition) {
    const def = senses[0].definition.slice(0, 155)
    return `${word}: ${def}${def.length >= 155 ? "…" : ""}`
  }

  // Oxford 形式: entries[0].senses[0].definitions[0]
  const entries = (dictionary as { entries?: { senses?: { definitions?: string[] }[] }[] }).entries
  const def = entries?.[0]?.senses?.[0]?.definitions?.[0]
  if (def) {
    const trimmed = def.slice(0, 155)
    return `${word}: ${trimmed}${trimmed.length >= 155 ? "…" : ""}`
  }

  return `Explore the etymology and meaning of "${word}" on RootLink.`
}

export async function generateMetadata({
  params,
}: {
  params: { word: string }
}): Promise<Metadata> {
  const raw = decodeURIComponent(params.word).trim().toLowerCase()
  const data = await resolveWord(raw)
  const word = data?.resolved ?? raw
  const description = extractDescription(data?.dictionary ?? data?.raw ?? null, word)

  return {
    title: word,
    description,
    openGraph: {
      title: `${word} | RootLink`,
      description,
      url: `https://www.rootlink.app/word/${encodeURIComponent(word)}`,
    },
    twitter: {
      card: "summary",
      title: `${word} | RootLink`,
      description,
    },
  }
}

export default async function Page({
  params,
}: {
  params: { word: string }
}) {
  const raw = decodeURIComponent(params.word).trim().toLowerCase()

  let dictionary = null
  let resolvedWord = raw
  let correctedFrom: string | undefined = undefined
  console.log("PAGE SERVER EXECUTION")

  const data = await resolveWord(raw)
  if (data) {
    resolvedWord = data.resolved
    dictionary = data.dictionary ?? data.raw ?? null
    if (typeof data.correctedFrom === "string") {
      correctedFrom = data.correctedFrom
    }
  }

  return (
    <WordPageClient
      word={resolvedWord}
      dictionary={dictionary}
      correctedFrom={correctedFrom}
    />
  )
}