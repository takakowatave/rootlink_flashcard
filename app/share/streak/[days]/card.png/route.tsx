// 投稿画像 (/share/streak/[days]/card.png?lv=N&up=1)
// Figma: xe5UwVx38JWu5doqwXczQu / node 2607-6345 (default / レベルアップ の2バリアント)
// SNS 直接投稿用の画像 (navigator.share の files に添付)。1200×1200 square。

import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const runtime = 'nodejs'

const SIZE = { width: 1200, height: 1200 }
const CACHE_HEADER = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'

type FontWeights = { medium: Buffer; bold: Buffer }
let fontsPromise: Promise<FontWeights> | null = null
let logoPromise: Promise<string> | null = null
const plantPromises = new Map<number, Promise<string>>()

function loadFonts(): Promise<FontWeights> {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      readFile(join(process.cwd(), 'public/fonts/NotoSansJP-Medium-subset.ttf')),
      readFile(join(process.cwd(), 'public/fonts/NotoSansJP-Bold-subset.ttf')),
    ]).then(([medium, bold]) => ({ medium, bold }))
  }
  return fontsPromise
}

function loadLogo(): Promise<string> {
  if (!logoPromise) {
    logoPromise = readFile(join(process.cwd(), 'public/logo.png')).then(
      (buf) => `data:image/png;base64,${buf.toString('base64')}`
    )
  }
  return logoPromise
}

function loadPlant(level: number): Promise<string> {
  const clamped = Math.min(5, Math.max(1, level))
  if (!plantPromises.has(clamped)) {
    plantPromises.set(
      clamped,
      readFile(join(process.cwd(), `public/plant/lv${clamped}.png`)).then(
        (buf) => `data:image/png;base64,${buf.toString('base64')}`
      )
    )
  }
  return plantPromises.get(clamped)!
}

function StreakCard({
  days,
  levelUp,
  plantSrc,
  logo,
}: {
  days: number
  levelUp: boolean
  plantSrc: string
  logo: string
}) {
  // 数字部分は桁数で縮める (1200px canvas を大きく崩さない)
  const digits = String(days).length
  const numFontSize = digits <= 3 ? 200 : digits === 4 ? 160 : 128
  const sideFontSize = digits <= 3 ? 100 : digits === 4 ? 88 : 76

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: '#cbfbf1',
        padding: 32,
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
          backgroundColor: '#ffffff',
          padding: '48px 32px',
          borderRadius: 32,
          gap: 48,
        }}
      >
        {/* 連続{days}日学習中 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            color: '#ff8904',
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          <span style={{ fontSize: sideFontSize }}>連続</span>
          <span style={{ fontSize: numFontSize, letterSpacing: '-0.02em', margin: '0 4px' }}>
            {days}
          </span>
          <span style={{ fontSize: sideFontSize }}>日学習中</span>
        </div>

        {/* subtitle: level-up は cream banner + gradient text / default は黒テキスト */}
        {levelUp ? (
          <div
            style={{
              display: 'flex',
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(255,217,51,0.2)',
              padding: '16px 0',
            }}
          >
            <span
              style={{
                fontSize: 72,
                fontWeight: 700,
                letterSpacing: '0.02em',
                backgroundImage:
                  'linear-gradient(90deg, #ff3826 0%, #ff731a 30%, #ffb20d 55%, #ffd933 80%, #ff8c26 100%)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              LEVEL UP!!!
            </span>
          </div>
        ) : (
          <span
            style={{
              fontSize: 60,
              fontWeight: 700,
              color: '#000000',
              lineHeight: 1,
            }}
          >
            毎日ログインして育てよう
          </span>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={plantSrc} width={600} height={600} alt="" style={{ objectFit: 'contain' }} />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={512} height={72} alt="RootLink" style={{ objectFit: 'contain' }} />
      </div>
    </div>
  )
}

export async function GET(
  req: Request,
  { params }: { params: { days: string } }
) {
  const url = new URL(req.url)
  const days = Math.max(0, Math.min(9999, parseInt(params.days ?? '0', 10) || 0))
  const lv = Math.max(1, Math.min(5, parseInt(url.searchParams.get('lv') ?? '1', 10) || 1))
  const levelUp = url.searchParams.get('up') === '1'

  const [fonts, logo, plantSrc] = await Promise.all([
    loadFonts(),
    loadLogo(),
    loadPlant(lv),
  ])

  const image = new ImageResponse(
    <StreakCard days={days} levelUp={levelUp} plantSrc={plantSrc} logo={logo} />,
    {
      ...SIZE,
      fonts: [
        { name: 'NotoSansJP', data: fonts.medium, weight: 500, style: 'normal' },
        { name: 'NotoSansJP', data: fonts.bold, weight: 700, style: 'normal' },
      ],
    }
  )
  image.headers.set('Cache-Control', CACHE_HEADER)
  return image
}
