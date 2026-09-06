import type { MetadataRoute } from "next"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const BASE_URL = "https://www.rootlink.app"

type ShardId = "main" | "words" | "blog"

export async function generateSitemaps(): Promise<{ id: ShardId }[]> {
  return [{ id: "main" }, { id: "words" }, { id: "blog" }]
}

function getSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

async function buildMainSitemap(
  supabase: SupabaseClient
): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticEntries: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/decks`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
  ]

  const { data: decks } = await supabase
    .from("decks")
    .select("id, created_at")
    .eq("is_official", true)
    .order("created_at", { ascending: false })

  const deckEntries: MetadataRoute.Sitemap =
    (decks ?? [])
      .map((d) => {
        const id = (d as { id: string | null }).id
        if (!id) return null
        const created = (d as { created_at: string | null }).created_at
        return {
          url: `${BASE_URL}/decks/${id}`,
          lastModified: created ? new Date(created) : now,
          changeFrequency: "monthly" as const,
          priority: 0.8,
        }
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)

  return [...staticEntries, ...deckEntries]
}

// Supabase の PostgREST は 1 リクエスト 1,000 行が上限なので .range で全ページ舐める
async function fetchAllCachedWords(
  supabase: SupabaseClient
): Promise<{ word: string; fetched_at: string | null }[]> {
  const pageSize = 1000
  const all: { word: string; fetched_at: string | null }[] = []
  let from = 0
  for (let page = 0; page < 20; page++) {
    const { data, error } = await supabase
      .from("dictionary_cache")
      .select("fetched_at, words!inner(word)")
      .not("payload", "is", null)
      .order("fetched_at", { ascending: false })
      .range(from, from + pageSize - 1)
    if (error || !data || data.length === 0) break
    for (const row of data as Array<{
      fetched_at: string | null
      words: { word: string } | { word: string }[] | null
    }>) {
      const w = Array.isArray(row.words) ? row.words[0]?.word : row.words?.word
      if (w) all.push({ word: w, fetched_at: row.fetched_at })
    }
    if (data.length < pageSize) break
    from += pageSize
  }
  return all
}

async function buildWordsSitemap(
  supabase: SupabaseClient
): Promise<MetadataRoute.Sitemap> {
  const cached = await fetchAllCachedWords(supabase)
  const now = new Date()
  return cached
    .filter(({ word }) => word.length > 2 && /^[a-z]+$/.test(word))
    .map(({ word, fetched_at }) => ({
      url: `${BASE_URL}/word/${encodeURIComponent(word)}`,
      lastModified: fetched_at ? new Date(fetched_at) : now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))
}

async function buildBlogSitemap(
  supabase: SupabaseClient
): Promise<MetadataRoute.Sitemap> {
  const { data: posts } = await supabase
    .from("posts")
    .select("slug, published_at, update_at")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(5000)

  const now = new Date()
  return (posts ?? [])
    .map((p) => {
      const slug = (p as { slug: string | null }).slug
      if (!slug) return null
      const updated =
        (p as { update_at: string | null }).update_at ??
        (p as { published_at: string | null }).published_at
      return {
        url: `${BASE_URL}/blog/${encodeURIComponent(slug)}`,
        lastModified: updated ? new Date(updated) : now,
        changeFrequency: "monthly" as const,
        priority: 0.8,
      }
    })
    .filter((e): e is NonNullable<typeof e> => e !== null)
}

export default async function sitemap({
  id,
}: {
  id: ShardId
}): Promise<MetadataRoute.Sitemap> {
  const supabase = getSupabase()
  if (id === "main") return buildMainSitemap(supabase)
  if (id === "words") return buildWordsSitemap(supabase)
  if (id === "blog") return buildBlogSitemap(supabase)
  return []
}
