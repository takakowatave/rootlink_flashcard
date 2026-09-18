// ブログ記事の OG 画像 (/blog/[slug] の opengraph-image)
// 1200×630。タイトル一本の構成で、記事ごとの画像作成を不要にする。
// - 外枠ミント + 白カードは単語カード (/word/[word]/card.png) と同じ世界観
// - タイトルは行数を増やす前にフォントサイズを下げる（1行 → 2行 → 3行）
// - posts.hero_image_url がある記事は generateMetadata 側の images が優先されるため、
//   この画像は「手動画像なし」のときだけ使われる
import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const runtime = 'nodejs'
export const alt = 'RootLink'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const MINT = '#00d5be'
const TEAL_700 = '#00786f'
const TEAL_50 = '#f0fdfa'
const BODY_WIDTH = 1040

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

type FontWeights = { regular: Buffer; medium: Buffer; bold: Buffer }
let fontsPromise: Promise<FontWeights> | null = null
let logoPromise: Promise<string> | null = null

function loadFonts(): Promise<FontWeights> {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      readFile(join(process.cwd(), 'public/fonts/NotoSansJP-Regular-subset.ttf')),
      readFile(join(process.cwd(), 'public/fonts/NotoSansJP-Medium-subset.ttf')),
      readFile(join(process.cwd(), 'public/fonts/NotoSansJP-Bold-subset.ttf')),
    ]).then(([regular, medium, bold]) => ({ regular, medium, bold }))
  }
  return fontsPromise
}

function loadLogoDataUrl(): Promise<string> {
  if (!logoPromise) {
    logoPromise = readFile(join(process.cwd(), 'public/logo.png')).then(
      (buf) => `data:image/png;base64,${buf.toString('base64')}`
    )
  }
  return logoPromise
}

type PostLite = { title: string; tags: string[] | null }

// 下書きも描画する。公開ページは 404 になるが、プレビュー確認で必要になる。
async function fetchPost(slug: string): Promise<PostLite | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/posts?select=title,tags&slug=eq.${encodeURIComponent(slug)}&limit=1`,
      {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        next: { revalidate: 300 },
      }
    )
    if (!res.ok) return null
    const rows = (await res.json()) as PostLite[]
    return rows?.[0] ?? null
  } catch {
    return null
  }
}

// 全角=1.0 / 半角=0.55 で概算した表示幅（em 単位）
function emWidth(s: string): number {
  let w = 0
  for (const ch of s) w += /[\x00-\x7F]/.test(ch) ? 0.55 : 1
  return w
}

// 行を増やす前にサイズを下げる。1行で 56px 以上を保てるなら1行、
// 次に2行で 48px 以上、最後に3行（最小 40px）。
function titleSize(s: string): number {
  const em = Math.max(emWidth(s), 1)
  const fit = (lines: number) => Math.min(76, Math.floor((BODY_WIDTH * lines) / em))
  if (fit(1) >= 56) return fit(1)
  if (fit(2) >= 48) return fit(2)
  return Math.max(40, fit(3))
}

// 「タイトル｜サブタイトル」を分割する
function splitTitle(t: string): [string, string | null] {
  const i = t.indexOf('｜')
  if (i === -1) return [t, null]
  return [t.slice(0, i).trim(), t.slice(i + 1).trim()]
}

export default async function Image({ params }: { params: { slug: string } }) {
  const [fonts, logo, post] = await Promise.all([
    loadFonts(),
    loadLogoDataUrl(),
    fetchPost(params.slug),
  ])

  const rawTitle = post?.title ?? '語源で覚える英単語'
  const [main, sub] = splitTitle(rawTitle)
  const tags = (post?.tags ?? []).slice(0, 2)

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', backgroundColor: MINT, padding: 16 }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
            padding: '56px 80px',
            fontFamily: 'NotoSansJP',
          }}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', width: 120, height: 6, backgroundColor: MINT, marginBottom: 36 }} />
            <div
              style={{
                display: 'flex',
                fontSize: titleSize(main),
                fontWeight: 700,
                color: '#000000',
                lineHeight: 1.3,
                letterSpacing: '-0.02em',
              }}
            >
              {main}
            </div>
            {sub && (
              <div
                style={{
                  display: 'flex',
                  fontSize: 32,
                  fontWeight: 500,
                  color: TEAL_700,
                  lineHeight: 1.4,
                  marginTop: 22,
                }}
              >
                {sub}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} width={186} height={26} alt="RootLink" />
              <div style={{ display: 'flex', fontSize: 22, color: '#64748b' }}>www.rootlink.app</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {tags.map((t) => (
                <div
                  key={t}
                  style={{
                    display: 'flex',
                    fontSize: 22,
                    fontWeight: 500,
                    color: TEAL_700,
                    backgroundColor: TEAL_50,
                    padding: '8px 18px',
                    borderRadius: 8,
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'NotoSansJP', data: fonts.regular, weight: 400, style: 'normal' },
        { name: 'NotoSansJP', data: fonts.medium, weight: 500, style: 'normal' },
        { name: 'NotoSansJP', data: fonts.bold, weight: 700, style: 'normal' },
      ],
    }
  )
}
