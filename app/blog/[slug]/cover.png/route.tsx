// ブログ記事のカバー画像 (/blog/[slug]/cover.png)
// 1200×630。OG 画像と記事ヘッダーの両方で同じ画像を使う。
// - 外枠ミント + 白カードは単語カード (/word/[word]/card.png) と同じ世界観
// - タイトルは行数を増やす前にフォントサイズを下げる（1行 → 2行 → 3行）
// - posts.hero_image_url がある記事は generateMetadata 側の images が優先されるため、
//   この画像は「手動画像なし」のときだけ使われる
import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { publishedNowIso } from '@/lib/blogQueries'

export const runtime = 'nodejs'

const SIZE = { width: 1200, height: 630 }
// 正しく描けたときだけ CDN に長めのキャッシュを許可する。
const CACHE_SUCCESS = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'
const CACHE_FALLBACK = 'no-store'

const MINT = '#00d5be'
const TEAL_700 = '#00786f'
const TEAL_50 = '#f0fdfa'
const BODY_WIDTH = 1040

const ROOT_PREFIX = 'eiken1-root-'

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

type PostLite = { title: string; tags: string[] | null; published_at: string | null; content?: string | null }

// 下書き (published_at=null) はプレビュー用途で描画を許すが、未来日付 (予約投稿)
// は 404 で弾く。判定は GET 側で行う (fetchPost は生データのみ返す)。
async function fetchPost(slug: string): Promise<PostLite | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/posts?select=${slug.startsWith(ROOT_PREFIX) ? 'title,tags,published_at,content' : 'title,tags,published_at'}&slug=eq.${encodeURIComponent(slug)}&limit=1`,
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

// 予約投稿 (published_at が未来) の判定
function isScheduledFuture(post: PostLite | null): boolean {
  if (!post?.published_at) return false
  return post.published_at > publishedNowIso()
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

// 「タイトル｜サブタイトル」と「〜の違いは？サブタイトル」を分割する。
// 問いかけの「？」は主題側に残す。
function splitTitle(t: string): [string, string | null] {
  const bar = t.indexOf('｜')
  if (bar !== -1) return [t.slice(0, bar).trim(), t.slice(bar + 1).trim()]

  const q = t.indexOf('？')
  if (q !== -1 && q < t.length - 1) {
    return [t.slice(0, q + 1).trim(), t.slice(q + 1).trim()]
  }
  return [t, null]
}


// ── 語根記事 (eiken1-root-*) 用 ─────────────────────
// タイトル「{root}」は「{意味}」… と本文の表「| 単語 | 分解 | 意味 |」から
// 先頭4語を読み、語根 → 単語の枝分かれ図を描く。読めなければ通常デザインに戻す。
type RootWord = { word: string; hl: [string, string, string]; meaning: string }
type RootCover = { root: string; meaning: string; words: RootWord[] }

function commonPrefix(a: string, b: string): number {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  return i
}

function parseRootCover(post: PostLite | null): RootCover | null {
  if (!post?.content) return null
  const m = post.title.match(/「([^」]+)」は「([^」]+)」/)
  if (!m) return null
  const root = m[1]
  const words: RootWord[] = []
  const rows = post.content.split('\n').filter((l) => l.trim().startsWith('|'))
  for (const row of rows) {
    const cells = row.split('|').slice(1, -1).map((c) => c.trim())
    if (cells.length < 3) continue
    const [word, parts, meaning] = cells
    if (!/^[a-zA-Z][a-zA-Z-]*$/.test(word)) continue
    // 分解セルから語根に一番近いパーツを探してハイライト
    let best = ''
    let score = 1
    for (const raw of parts.split('+')) {
      const t = raw.replace(/（.*$/, '').replace(/\(.*$/, '').trim().toLowerCase()
      const sc = commonPrefix(t, root.toLowerCase())
      if (sc > score) { score = sc; best = t }
    }
    const idx = best ? word.toLowerCase().indexOf(best) : -1
    const hl: [string, string, string] =
      idx >= 0 ? [word.slice(0, idx), word.slice(idx, idx + best.length), word.slice(idx + best.length)] : [word, '', '']
    words.push({ word, hl, meaning: meaning.split('・')[0].trim() })
    if (words.length === 4) break
  }
  if (words.length < 2) return null
  return { root, meaning: m[2], words }
}

const INK = '#020617'
const TEAL = '#009689'
const TEAL_DARK = '#005f5a'

function RootCoverImage({ data, logo }: { data: RootCover; logo: string }) {
  const n = data.words.length
  const cardH = 96
  const gap = Math.floor((630 - 120 - cardH * n) / Math.max(n - 1, 1))
  const tops = data.words.map((_, i) => 60 + i * (cardH + gap))
  const rootSize = Math.min(110, Math.floor(280 / (data.root.length * 0.62)))
  const rootTop = 190
  const rootH = 250
  const cy = rootTop + rootH / 2
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        backgroundColor: TEAL_50,
        backgroundImage: 'radial-gradient(circle, #00968922 2px, transparent 2.5px)',
        backgroundSize: '40px 40px',
        fontFamily: 'NotoSansJP',
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1200, height: 630, display: 'flex' }}>
      <svg width={1200} height={630} viewBox="0 0 1200 630">
        {tops.map((t) => {
          const y = t + cardH / 2
          return (
            <path
              key={t}
              d={`M390 ${cy} C 480 ${cy}, 480 ${y}, 570 ${y}`}
              stroke={TEAL}
              strokeWidth={9}
              fill="none"
              strokeLinecap="round"
            />
          )
        })}
      </svg>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 60,
          top: rootTop,
          width: 330,
          height: rootH,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: TEAL,
          border: `5px solid ${INK}`,
          borderRadius: 30,
          boxShadow: `0 9px 0 ${TEAL_DARK}`,
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', fontSize: rootSize, fontWeight: 700, lineHeight: 1 }}>{data.root}</div>
        <div style={{ display: 'flex', fontSize: 38, fontWeight: 700, marginTop: 14 }}>{data.meaning}</div>
      </div>
      {data.words.map((w, i) => {
        const size = Math.min(56, Math.floor(300 / (w.word.length * 0.6)))
        return (
          <div
            key={w.word}
            style={{
              position: 'absolute',
              left: 570,
              top: tops[i],
              width: 570,
              height: cardH,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
              padding: '0 30px',
              backgroundColor: '#ffffff',
              border: `4px solid ${INK}`,
              borderRadius: 22,
              boxShadow: `0 7px 0 ${INK}`,
            }}
          >
            <div style={{ display: 'flex', fontSize: size, fontWeight: 700, color: INK, letterSpacing: '-0.01em' }}>
              <span>{w.hl[0]}</span>
              <span style={{ color: TEAL }}>{w.hl[1]}</span>
              <span>{w.hl[2]}</span>
            </div>
            <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: '#475569' }}>{w.meaning}</div>
          </div>
        )
      })}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo} width={186} height={26} alt="RootLink" style={{ position: 'absolute', left: 64, bottom: 44 }} />
    </div>
  )
}

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const [fonts, logo, post] = await Promise.all([
    loadFonts(),
    loadLogoDataUrl(),
    fetchPost(params.slug),
  ])

  // 予約投稿 (未来日付) はカバー画像も 404 で返す (SEO・拡散のプレビューでヒットさせない)。
  // 下書き (published_at=null) はプレビュー用途で従来通り描画を許す。
  if (isScheduledFuture(post)) {
    return new Response(null, { status: 404, headers: { 'Cache-Control': CACHE_FALLBACK } })
  }

  const rawTitle = post?.title ?? '語源で覚える英単語'
  const [main, sub] = splitTitle(rawTitle)
  const tags = (post?.tags ?? []).slice(0, 2)

  const rootCover = params.slug.startsWith(ROOT_PREFIX) ? parseRootCover(post) : null

  const image = new ImageResponse(
    rootCover ? (
      <RootCoverImage data={rootCover} logo={logo} />
    ) : (
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
      ...SIZE,
      fonts: [
        { name: 'NotoSansJP', data: fonts.regular, weight: 400, style: 'normal' },
        { name: 'NotoSansJP', data: fonts.medium, weight: 500, style: 'normal' },
        { name: 'NotoSansJP', data: fonts.bold, weight: 700, style: 'normal' },
      ],
    }
  )
  // Vercel は .png の拡張子で長期キャッシュを自動付与するので set() で上書きする。
  image.headers.set('Cache-Control', post ? CACHE_SUCCESS : CACHE_FALLBACK)
  return image
}
