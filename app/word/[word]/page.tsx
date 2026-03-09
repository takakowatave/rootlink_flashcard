import WordPageClient from '@/components/WordPageClient'

export default async function Page({
  params,
}: {
  params: { word: string }
}) {
  const raw = decodeURIComponent(params.word).trim().toLowerCase()

  let dictionary = null
  let resolvedWord = raw
console.log("PAGE SERVER EXECUTION")

  try {
    const res = await fetch(
      "https://rootlink-server-v2-774622345521.asia-northeast1.run.app/resolve",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: raw }),
        cache: "no-store",
      }
    )

    if (res.ok) {
      const data = await res.json()
      console.log("RESOLVE RESPONSE:", data)
      console.log("RAW FROM SERVER:", data.raw)
      console.log("DICTIONARY FROM SERVER:", data.dictionary)
    
      if (data.ok) {
        resolvedWord = data.resolved
        dictionary = data.dictionary ?? data.raw ?? null
      }
    }
  } catch (e) {
    console.error(e)
  }

  return (
    <WordPageClient
      word={resolvedWord}
      dictionary={dictionary}
    />
  )
}