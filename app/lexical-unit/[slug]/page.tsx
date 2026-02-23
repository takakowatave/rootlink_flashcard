import IdiomPageClient from '@/components/lexicalUnitPageClient'

export default async function Page({
  params,
}: {
  params: { slug: string }
}) {
  const rawSlug = decodeURIComponent(params.slug)
    .replace(/-/g, ' ')
    .trim()
    .toLowerCase()

  let resolved = rawSlug

  try {
    const res = await fetch(
      "https://rootlink-server-v2-774622345521.asia-northeast1.run.app/resolve",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: rawSlug }),
        cache: "no-store",
      }
    )

    if (res.ok) {
      const data = await res.json()
      if (data.ok) {
        resolved = data.resolved
      }
    }
  } catch (e) {
    console.error(e)
  }

  return <IdiomPageClient slug={resolved} />
}