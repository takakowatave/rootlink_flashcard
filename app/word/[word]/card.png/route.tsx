// 単語カード PNG (/word/[word]/card.png)
// og:image と SNS 投稿DL の両用画像。1200×675。Figma design node 2319:8251 準拠。
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
  etymologyDescription: string | null
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

// Figma: "機械や車両の部品" (DB は "より大きなものの一部、特に機械や車両の部品")
// → 「特に」以降のより具体的な部分を優先。無ければ全文。
function compactMeaning(raw: string | null | undefined): string | null {
  if (!raw) return null
  const marker = '、特に'
  const idx = raw.indexOf(marker)
  const compact = idx >= 0 ? raw.slice(idx + marker.length) : raw
  return compact.trim()
}

// Figma: 語源説明は 1 文だけ (最初の「。」まで)
function firstSentence(raw: string | null | undefined): string | null {
  if (!raw) return null
  const end = raw.indexOf('。')
  return end >= 0 ? raw.slice(0, end + 1) : raw
}

// "componentから来ています。" 系の空 description は非表示
function isJunkDescription(raw: string | null | undefined): boolean {
  if (!raw) return false
  return /^[^。]{1,80}から来てい(ます|る)[。．]?\s*$/.test(raw.trim())
}

function extractCardData(word: string, payload: RewrittenPayload | null): CardData {
  if (!payload) {
    return { word, parts: [], meaning: null, etymologyDescription: null }
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

  const etymologyJa = payload.locales?.ja?.etymology
  const hook = etymologyJa?.hook?.trim() || null
  const rawDescription = etymologyJa?.description ?? null
  const description = isJunkDescription(rawDescription)
    ? null
    : firstSentence(rawDescription)

  return {
    word,
    parts,
    meaning: compactMeaning(jaSense?.meaning ?? firstSense?.definition ?? null),
    etymologyDescription: hook ?? description,
  }
}

function truncate(text: string, max: number): string {
  if (!text) return ''
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}

// ── card layout (Figma 2319:8251 準拠) ─────────
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
        backgroundColor: '#ffffff',
        border: '24px solid #96f7e4', // teal-200
        fontFamily: 'NotoSansJP',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 76px',
          gap: 49,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={280} height={39} alt="RootLink" />

        <div
          style={{
            fontSize: 90,
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
              fontSize: 52,
              color: '#000000',
              lineHeight: 1.1,
              textAlign: 'center',
              display: 'flex',
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
              gap: 16,
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
                    padding: 8,
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
                      padding: '10px 24px',
                      fontSize: 36,
                      fontWeight: 500,
                      color: '#00786f', // teal-700
                      display: 'flex',
                    }}
                  >
                    {p.text}
                  </div>
                  {(p.meaningJa || p.meaning) && (
                    <div
                      style={{
                        fontSize: 32,
                        fontWeight: 500,
                        color: '#00786f',
                        display: 'flex',
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
                  fontSize: 32,
                  fontWeight: 400,
                  color: '#00786f',
                  lineHeight: '42px',
                  display: 'flex',
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
        border: '24px solid #96f7e4',
        fontFamily: 'NotoSansJP',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo}
        width={280}
        height={39}
        alt="RootLink"
        style={{ marginBottom: 49 }}
      />
      <div
        style={{
          fontSize: 90,
          fontWeight: 700,
          color: '#000000',
          letterSpacing: '-0.02em',
          display: 'flex',
        }}
      >
        {truncate(word, 22)}
      </div>
      <div style={{ fontSize: 32, color: '#00786f', marginTop: 20, display: 'flex' }}>
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
