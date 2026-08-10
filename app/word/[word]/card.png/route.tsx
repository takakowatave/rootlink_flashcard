// 単語カード PNG (/word/[word]/card.png)
// og:image と SNS 投稿 DL の両用画像。1200×675。
// - Oxford の rawEtymology を語源説明として描画（hook は品質問題で一旦封印）
// - 意味は末尾を「…」で truncate（頭切り禁止）
// - 中央 1200×628 のセーフゾーンに重要要素を収める
// - ミントの外枠とロゴは残す

import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { RewrittenPayload } from '@/types/Dictionary'

export const runtime = 'nodejs'

const SIZE = { width: 1200, height: 675 }
const CACHE_HEADER = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=86400'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ── asset ローダー（プロセス内キャッシュ） ─────────
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

// ── payload fetch ──────────────────────────────
type EtymologyPartLite = { text: string; meaningJa?: string | null; meaning?: string | null }
type CardData = {
  word: string
  parts: EtymologyPartLite[]
  meaning: string | null
  hook: string | null
  rawEtymology: string | null
}

async function fetchPayload(word: string): Promise<RewrittenPayload | null> {
  const url =
    `${SUPABASE_URL}/rest/v1/words?word=eq.${encodeURIComponent(word)}` +
    `&select=id,dictionary_cache(payload)&limit=1`
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    next: { revalidate: 60 * 60 },
  })
  if (!res.ok) return null
  const rows = (await res.json()) as Array<{
    id: string
    dictionary_cache: { payload: RewrittenPayload } | null
  }>
  return rows?.[0]?.dictionary_cache?.payload ?? null
}

function extractCardData(word: string, payload: RewrittenPayload | null): CardData {
  if (!payload) {
    return { word, parts: [], meaning: null, hook: null, rawEtymology: null }
  }

  const parts: EtymologyPartLite[] =
    payload.etymologyData?.structure.type === 'parts'
      ? payload.etymologyData.structure.parts
          .filter((p) => p.text)
          .slice(0, 2)
          .map((p) => ({
            text: p.text,
            meaningJa: p.meaningJa ?? null,
            meaning: p.meaning ?? null,
          }))
      : []

  const firstGroup = payload.senseGroups?.[0]
  const firstSense = firstGroup?.senses?.[0]
  const senseId = firstSense?.senseId ?? ''
  const jaSense = payload.locales?.ja?.senses?.[senseId]

  const hook = payload.locales?.ja?.etymology?.hook?.trim() || null
  const rawEtymology = payload.etymology?.trim() || null

  return {
    word,
    parts,
    meaning: (jaSense?.meaning ?? firstSense?.definition ?? '').trim() || null,
    hook,
    rawEtymology,
  }
}

function truncate(text: string, max: number): string {
  if (!text) return ''
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}

// ── card layout ────────────────────────────────
type CardProps = { data: CardData; logo: string }

function BulbIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="#00786f" style={{ flexShrink: 0 }}>
      <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
    </svg>
  )
}

function Card({ data, logo }: CardProps) {
  const meaning = data.meaning ? truncate(data.meaning, 34) : null
  // hook は品質問題で一旦封印。Oxford の rawEtymology のみ描画。
  const hook = data.rawEtymology ? truncate(data.rawEtymology, 60) : null

  return (
    // ミント外枠（16px の面取り + 内側白）
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: '#00d5be',
        padding: 16,
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          // 縦セーフゾーン: 1200×628 相当。上下 33px を余白として捨てる。
          padding: '33px 64px',
          gap: 24,
          fontFamily: 'NotoSansJP',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={200} height={28} alt="RootLink" />

        <div
          style={{
            fontSize: 88,
            fontWeight: 700,
            color: '#000000',
            lineHeight: 1,
            letterSpacing: '-0.02em',
            display: 'flex',
          }}
        >
          {truncate(data.word, 22)}
        </div>

        {meaning && (
          <div
            style={{
              fontSize: 38,
              color: '#000000',
              lineHeight: 1.15,
              textAlign: 'center',
              display: 'flex',
            }}
          >
            {meaning}
          </div>
        )}

        {(data.parts.length > 0 || hook) && (
          <div
            style={{
              width: '100%',
              backgroundColor: '#f0fdfa',
              padding: '22px 26px',
              borderRadius: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
          >
            {data.parts.length > 0 && (
              <div style={{ display: 'flex', gap: 20, width: '100%' }}>
                {data.parts.slice(0, 2).map((p, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        border: '2px solid #00d5be',
                        borderRadius: 90,
                        padding: '6px 20px',
                        fontSize: 28,
                        fontWeight: 500,
                        color: '#00786f',
                        display: 'flex',
                      }}
                    >
                      {p.text}
                    </div>
                    {(p.meaningJa || p.meaning) && (
                      <div
                        style={{
                          fontSize: 26,
                          fontWeight: 500,
                          color: '#000000',
                          display: 'flex',
                        }}
                      >
                        {p.meaningJa ?? p.meaning}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {hook && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <BulbIcon />
                <div
                  style={{
                    fontSize: 34,
                    fontWeight: 500,
                    color: '#00786f',
                    lineHeight: 1.35,
                    display: 'flex',
                    flex: 1,
                  }}
                >
                  {hook}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function FallbackCard({ word, logo }: { word: string; logo: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: '#00d5be',
        padding: 16,
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          fontFamily: 'NotoSansJP',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={200} height={28} alt="RootLink" style={{ marginBottom: 40 }} />
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: '#000000',
            letterSpacing: '-0.02em',
            display: 'flex',
          }}
        >
          {truncate(word, 22)}
        </div>
        <div style={{ fontSize: 30, color: '#00786f', marginTop: 20, display: 'flex' }}>
          語源から学ぶ英単語 — RootLink
        </div>
      </div>
    </div>
  )
}

// ── GET handler ────────────────────────────────
export async function GET(
  _req: Request,
  { params }: { params: { word: string } }
) {
  const raw = decodeURIComponent(params.word).replace(/_/g, ' ').trim().toLowerCase()

  const [fonts, logo, payload] = await Promise.all([
    loadFonts(),
    loadLogoDataUrl(),
    fetchPayload(raw).catch(() => null),
  ])

  const data = extractCardData(raw, payload)
  const hasContent = Boolean(data.meaning || data.parts.length > 0)

  return new ImageResponse(
    hasContent ? <Card data={data} logo={logo} /> : <FallbackCard word={raw} logo={logo} />,
    {
      ...SIZE,
      fonts: [
        { name: 'NotoSansJP', data: fonts.regular, weight: 400, style: 'normal' },
        { name: 'NotoSansJP', data: fonts.medium, weight: 500, style: 'normal' },
        { name: 'NotoSansJP', data: fonts.bold, weight: 700, style: 'normal' },
      ],
      headers: {
        'Cache-Control': CACHE_HEADER,
      },
    }
  )
}
