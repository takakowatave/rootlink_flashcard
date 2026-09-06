const BASE_URL = 'https://www.rootlink.app'
const SHARDS = ['main', 'words', 'blog'] as const

export const dynamic = 'force-dynamic'

export function GET(): Response {
  const now = new Date().toISOString()
  const entries = SHARDS.map(
    (id) => `  <sitemap>
    <loc>${BASE_URL}/sitemap/${id}.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`
  ).join('\n')
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>
`
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}
