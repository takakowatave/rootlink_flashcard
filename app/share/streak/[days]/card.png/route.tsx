// 連続記録シェア画像 (/share/streak/[days]/card.png?lv=N)
// SNS シェア時の OGP 画像。1200×630 (Twitter summary_large_image / og:image 標準)。
// Figma: xe5UwVx38JWu5doqwXczQu / node 2538-6079
// (Figma は portrait 594×688 だが Twitter が 1.91:1 で crop するため landscape に組み直し)

import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const runtime = 'nodejs'

const SIZE = { width: 1200, height: 630 }
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
  plantSrc,
  logo,
}: {
  days: number
  plantSrc: string
  logo: string
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: '#00d5be',
        padding: 24,
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          fontFamily: 'NotoSansJP',
          padding: '32px 56px',
          gap: 32,
        }}
      >
        {/* 左: 数字 + 「連続学習中」 + ロゴ */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              position: 'relative',
            }}
          >
            {/* 黄色ハイライト */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 100,
                bottom: 6,
                height: 26,
                backgroundColor: '#FDE68A',
                zIndex: 0,
              }}
            />
            <span
              style={{
                fontSize: 200,
                fontWeight: 700,
                color: '#F97316',
                lineHeight: 1,
                letterSpacing: '-0.04em',
                zIndex: 1,
              }}
            >
              {days}
            </span>
            <span
              style={{
                fontSize: 88,
                fontWeight: 700,
                color: '#F97316',
                lineHeight: 1,
                marginLeft: 10,
                zIndex: 1,
              }}
            >
              日
            </span>
          </div>

          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: '#F97316',
              lineHeight: 1,
              display: 'flex',
            }}
          >
            連続学習中
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={200} height={28} alt="RootLink" style={{ marginTop: 16 }} />
        </div>

        {/* 右: 鉢植え */}
        <div
          style={{
            width: 360,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={plantSrc} width={360} height={360} alt="" />
        </div>
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

  const [fonts, logo, plantSrc] = await Promise.all([
    loadFonts(),
    loadLogo(),
    loadPlant(lv),
  ])

  const image = new ImageResponse(
    <StreakCard days={days} plantSrc={plantSrc} logo={logo} />,
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
