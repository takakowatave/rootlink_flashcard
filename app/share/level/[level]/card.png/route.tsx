// レベルアップ通知シェア画像 (/share/level/[level]/card.png)
// SNS 直接投稿用の画像 (navigator.share の files に添付)。1200×1200 square。
// streak カード (Figma 2538-6079) と同一の骨格。文言のみ差し替え。

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

function LevelUpCard({
  level,
  plantSrc,
  logo,
}: {
  level: number
  plantSrc: string
  logo: string
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: '#cbfbf1',
        padding: 32,
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
          padding: '32px',
          borderRadius: 32,
          gap: 60,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 30,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              lineHeight: 1,
            }}
          >
            <span
              style={{
                fontSize: 144,
                fontWeight: 700,
                color: '#ff8904',
                lineHeight: 1,
                marginRight: 8,
              }}
            >
              Lv.
            </span>
            <span
              style={{
                fontSize: 288,
                fontWeight: 700,
                color: '#ff8904',
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {level}
            </span>
          </div>

          <div
            style={{
              fontSize: 92,
              fontWeight: 700,
              color: '#00d5be',
              lineHeight: 1,
              display: 'flex',
              letterSpacing: '0.02em',
            }}
          >
            レベルアップ！
          </div>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={plantSrc} width={600} height={440} alt="" style={{ objectFit: 'contain' }} />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={512} height={72} alt="RootLink" style={{ objectFit: 'contain' }} />
      </div>
    </div>
  )
}

export async function GET(
  req: Request,
  { params }: { params: { level: string } }
) {
  const level = Math.max(1, Math.min(8, parseInt(params.level ?? '1', 10) || 1))

  const [fonts, logo, plantSrc] = await Promise.all([
    loadFonts(),
    loadLogo(),
    loadPlant(level),
  ])

  const image = new ImageResponse(
    <LevelUpCard level={level} plantSrc={plantSrc} logo={logo} />,
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
