// 単語カード画像 (/word/[word]/card.png) 用のアセットを生成する一回限りのスクリプト
//
// 実行:
//   node scripts/generate-og-assets.mjs
//
// 出力:
//   public/logo.png                                — satori 用のブランドロゴ (SVG→PNG)
//   public/fonts/NotoSansJP-Regular-subset.ttf    — 400 常用漢字+かな+ASCII
//   public/fonts/NotoSansJP-Medium-subset.ttf     — 500 (語源パーツ pill 用)
//   public/fonts/NotoSansJP-Bold-subset.ttf       — 700 (見出し語 word 用)

import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import sharp from 'sharp'
import subsetFont from 'subset-font'

const require = createRequire(import.meta.url)
const joyoKanji = require('joyo-kanji')

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..')

// ── 1. Logo: SVG → PNG ─────────────────────────────────────
async function generateLogo() {
  const svgPath = path.join(ROOT, 'public/logo.svg')
  const pngPath = path.join(ROOT, 'public/logo.png')
  const svg = await fs.readFile(svgPath)
  // カード上部に置くサイズ想定 (Retina 相当で 240×34)
  await sharp(svg).resize(240, 34).png().toFile(pngPath)
  const stat = await fs.stat(pngPath)
  console.log(`✓ public/logo.png (${(stat.size / 1024).toFixed(1)} KB)`)
}

// ── 2. Font: NotoSansJP を JP + ASCII にサブセット ─────────
function buildCharset() {
  const chars = new Set()
  // ASCII printable
  for (let c = 0x20; c <= 0x7E; c++) chars.add(String.fromCharCode(c))
  // CJK punctuation
  for (let c = 0x3000; c <= 0x303F; c++) chars.add(String.fromCharCode(c))
  // Hiragana
  for (let c = 0x3040; c <= 0x309F; c++) chars.add(String.fromCharCode(c))
  // Katakana + Katakana Phonetic Extensions
  for (let c = 0x30A0; c <= 0x30FF; c++) chars.add(String.fromCharCode(c))
  for (let c = 0x31F0; c <= 0x31FF; c++) chars.add(String.fromCharCode(c))
  // Halfwidth/Fullwidth Forms
  for (let c = 0xFF00; c <= 0xFFEF; c++) chars.add(String.fromCharCode(c))
  // General punctuation (— …)
  for (let c = 0x2000; c <= 0x206F; c++) chars.add(String.fromCharCode(c))
  // 常用漢字 (2136) は joyo-kanji パッケージから取得
  for (const ch of joyoKanji.kanji) chars.add(ch)
  return chars
}

// Google Fonts の CSS API 経由で NotoSansJP の指定 weight TTF URL を取得する。
// User-Agent を古めに指定すると unicode-range 分割されない単一 TTF を返してくる。
async function fetchFontBinary(weight) {
  const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@${weight}&display=swap`
  const cssRes = await fetch(cssUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!cssRes.ok) throw new Error(`Google Fonts CSS fetch failed (${weight}): ${cssRes.status}`)
  const css = await cssRes.text()
  const match = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.ttf)\)/)
  if (!match) throw new Error(`TTF URL not found in Google Fonts CSS (${weight})`)
  const ttfRes = await fetch(match[1])
  if (!ttfRes.ok) throw new Error(`TTF fetch failed (${weight}): ${ttfRes.status}`)
  return Buffer.from(await ttfRes.arrayBuffer())
}

async function generateFontWeight(weight, filename) {
  const chars = buildCharset()
  const target = Array.from(chars).join('')

  console.log(`Downloading NotoSansJP weight ${weight}...`)
  const fontBuf = await fetchFontBinary(weight)

  console.log(`Subsetting weight ${weight} to ${chars.size} chars...`)
  const subset = await subsetFont(fontBuf, target, { targetFormat: 'truetype' })

  const outPath = path.join(ROOT, `public/fonts/${filename}`)
  await fs.writeFile(outPath, subset)
  const stat = await fs.stat(outPath)
  console.log(`✓ public/fonts/${filename} (${(stat.size / 1024).toFixed(1)} KB)`)
}

async function generateFonts() {
  await generateFontWeight(400, 'NotoSansJP-Regular-subset.ttf')
  await generateFontWeight(500, 'NotoSansJP-Medium-subset.ttf')
  await generateFontWeight(700, 'NotoSansJP-Bold-subset.ttf')
}

await generateLogo()
await generateFonts()
console.log('Done.')
