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
      exampleEn: null,
      exampleJa: null,
    }
  }

  const parts: EtymologyPartLite[] =
    payload.etymologyData?.structure.type === 'parts'
      ? payload.etymologyData.structure.parts
          .filter((p) => p.text)
          .slice(0, 3)
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
    exampleEn: firstSense?.example ?? null,
    exampleJa: jaSense?.exampleTranslation ?? null,
  }
}

const POS_JA: Record<string, string> = {
  noun: '名詞',
  verb: '動詞',
  adjective: '形容詞',
  adverb: '副詞',
  pronoun: '代名詞',
  preposition: '前置詞',
  conjunction: '接続詞',
  determiner: '限定詞',
  interjection: '間投詞',
}

const PART_COLORS: Record<string, { border: string; text: string; bg: string }> = {
  default: { border: '#22c55e', text: '#16a34a', bg: '#f0fdf4' },
}

function truncate(text: string, max: number): string {
  if (!text) return ''
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}

// ── card layout ────────────────────────────────
type CardProps = { data: CardData; logo: string }

function Card({ data, logo }: CardProps) {
  const chip = PART_COLORS.default
  const posLabel = data.pos ? POS_JA[data.pos] ?? data.pos : null
  const meaning = data.meaning ? truncate(data.meaning, 90) : null
  const exampleEn = data.exampleEn ? truncate(data.exampleEn, 110) : null
  const exampleJa = data.exampleJa ? truncate(data.exampleJa, 80) : null

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: '56px 72px',
        fontFamily: 'NotoSansJP',
        position: 'relative',
      }}
    >
      {/* 背景アクセント */}
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

      {/* Header: logo */}
      <div style={{ display: 'flex', alignItems: 'center', height: 40 }}>
        {/* logoは 240x34。高さ 34 で表示 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={240} height={34} alt="RootLink" />
      </div>

      {/* Headword */}
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 32 }}>
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: '#0f172a',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {truncate(data.word, 22)}
        </div>
        {data.ipa && (
          <div
            style={{
              fontSize: 28,
              color: '#64748b',
              marginTop: 14,
              lineHeight: 1,
            }}
          >
            /{data.ipa}/
          </div>
        )}
      </div>

      {/* Etymology parts */}
      {data.parts.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 28,
            flexWrap: 'wrap',
          }}
        >
          {data.parts.map((p, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                backgroundColor: chip.bg,
                border: `2px solid ${chip.border}`,
                borderRadius: 999,
                padding: '10px 18px',
              }}
            >
              <div
                style={{
                  fontSize: 26,
                  color: chip.text,
                  fontWeight: 700,
                }}
              >
                {p.text}
              </div>
              {(p.meaningJa || p.meaning) && (
                <div style={{ fontSize: 22, color: '#166534' }}>
                  {p.meaningJa ?? p.meaning}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Meaning + example */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginTop: 'auto',
          gap: 12,
        }}
      >
        {posLabel && (
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              backgroundColor: '#f1f5f9',
              color: '#475569',
              fontSize: 20,
              padding: '4px 14px',
              borderRadius: 6,
            }}
          >
            {posLabel}
          </div>
        )}
        {meaning && (
          <div
            style={{
              fontSize: 32,
              color: '#1e293b',
              lineHeight: 1.35,
            }}
          >
            {meaning}
          </div>
        )}
        {exampleEn && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: 4,
              paddingLeft: 16,
              borderLeft: '3px solid #cbd5e1',
              gap: 4,
            }}
          >
            <div style={{ fontSize: 22, color: '#475569', fontStyle: 'italic' }}>
              {exampleEn}
            </div>
            {exampleJa && (
              <div style={{ fontSize: 20, color: '#94a3b8' }}>{exampleJa}</div>
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
