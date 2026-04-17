import type { MetadataRoute } from "next"
import { createClient } from "@supabase/supabase-js"

const BASE_URL = "https://www.rootlink.app"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // dictionary_cache に存在する単語のみ（ページが生成済みのもの）
  const { data: words } = await supabase
    .from("dictionary_cache")
    .select("words(word), fetched_at")
    .not("words", "is", null)
    .order("fetched_at", { ascending: false })
    .limit(5000)

  const wordEntries: MetadataRoute.Sitemap =
    (words ?? [])
      .map((row) => {
        const wordsData = row.words as unknown as { word: string } | { word: string }[] | null
        const word = Array.isArray(wordsData) ? wordsData[0]?.word : wordsData?.word
        if (!word) return null
        return {
          url: `${BASE_URL}/word/${encodeURIComponent(word)}`,
          lastModified: row.fetched_at ? new Date(row.fetched_at) : new Date(),
          changeFrequency: "monthly" as const,
          priority: 0.7,
        }
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    ...wordEntries,
  ]
}
