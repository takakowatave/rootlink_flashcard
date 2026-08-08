// 単語カード PNG (/word/[word]/card.png)
// og:image と SNS 投稿DL の両用画像。1200×675。
// - フォントはリポジトリに同梱したサブセット TTF を使う（実行時 Google Fonts fetch はしない）
// - ロゴは PNG（satori の SVG サポートは限定的）
// - Route Handler では revalidate が効かないので Cache-Control ヘッダを明示

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
let fontPromise: Promise<Buffer> | null = null
let logoPromise: Promise<string> | null = null

function loadFont(): Promise<Buffer> {
  if (!fontPromise) {
    fontPromise = readFile(
      join(process.cwd(), 'public/fonts/NotoSansJP-Regular-subset.ttf')
    )
  }
  return fontPromise
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
  ipa: string | null
  parts: EtymologyPartLite[]
  pos: string | null
  meaning: string | null
  etymologyDescription: string | null
  exampleEn: string | null
  exampleJa: string | null
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
    dictionary_cache: Array<{ payload: RewrittenPayload }> | null
  }>
  return rows?.[0]?.dictionary_cache?.[0]?.payload ?? null
}

function extractCardData(word: string, payload: RewrittenPayload | null): CardData {
  if (!payload) {
    return {
      word,
      ipa: null,
      parts: [],
      pos: null,
      meaning: null,
      etymologyDescription: null,
      exampleEn: null,
      exampleJa: null,
    }
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

  return {
    word,
    ipa: payload.ipa ?? null,
    parts,
    pos: firstGroup?.partOfSpeech ?? null,
    meaning: jaSense?.meaning ?? firstSense?.definition ?? null,
    etymologyDescription: payload.locales?.ja?.etymology?.description ?? null,
    exampleEn: firstSense?.example ?? null,
    exampleJa: jaSense?.exampleTranslation ?? null,
  }
}

function truncate(text: string, max: number): string {
  if (!text) return ''
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}

// ── card layout ────────────────────────────────
type CardProps = { data: CardData; logo: string }

function Card({ data, logo }: CardProps) {
  const meaning = data.meaning ? truncate(data.meaning, 22) : null
  const etymologyDesc = data.etymologyDescription
    ? truncate(data.etymologyDescription, 60)
    : null

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: '#96f7e4', // teal-200 outer border
        padding: 28,
        fontFamily: 'NotoSansJP',
      }}
    >
      <div
        style={{
          flex: 1,
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 100px',
          gap: 40,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={280} height={39} alt="RootLink" />

        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: '#000000',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {truncate(data.word, 22)}
        </div>

        {meaning && (
          <div
            style={{
              fontSize: 52,
              color: '#000000',
              lineHeight: 1.1,
              textAlign: 'center',
            }}
          >
            {meaning}
          </div>
        )}

        {data.parts.length > 0 && (
          <div
            style={{
              width: '100%',
              backgroundColor: '#f0fdfa', // teal-50
              padding: 16,
              borderRadius: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              {data.parts.slice(0, 2).map((p, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    backgroundColor: '#cbfbf1', // teal-100
                    borderRadius: 8,
                    padding: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      border: '2px solid #00d5be', // teal-400
                      borderRadius: 90,
                      padding: '10px 22px',
                      fontSize: 36,
                      color: '#00786f', // teal-700
                      fontWeight: 500,
                      display: 'flex',
                    }}
                  >
                    {p.text}
                  </div>
                  {(p.meaningJa || p.meaning) && (
                    <div
                      style={{
                        fontSize: 30,
                        color: '#00786f',
                        fontWeight: 500,
                      }}
                    >
                      {p.meaningJa ?? p.meaning}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {etymologyDesc && (
              <div
                style={{
                  fontSize: 26,
                  color: '#00786f', // teal-700
                  lineHeight: 1.35,
                }}
              >
                {etymologyDesc}
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
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        fontFamily: 'NotoSansJP',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          backgroundColor: '#00AD82',
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo}
        width={280}
        height={40}
        alt="RootLink"
        style={{ marginBottom: 40 }}
      />
      <div
        style={{
          fontSize: 88,
          fontWeight: 700,
          color: '#0f172a',
          letterSpacing: '-0.02em',
        }}
      >
        {truncate(word, 22)}
      </div>
      <div style={{ fontSize: 24, color: '#64748b', marginTop: 20 }}>
        語源から学ぶ英単語 — RootLink
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

  const [font, logo, payload] = await Promise.all([
    loadFont(),
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
        {
          name: 'NotoSansJP',
          data: font,
          weight: 400,
          style: 'normal',
        },
      ],
      headers: {
        'Cache-Control': CACHE_HEADER,
      },
    }
  )
}
