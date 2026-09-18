// タブレット (800x1280) / スマホ (390x844) で TutorialOverlay の
// ハイライト枠が実際のターゲット要素と一致しているかを確認する。
//
// TutorialOverlay は auth ゲートが厚いので、本物の tutorial を出さず、
// レンダー済みのページに JS で spotlight SVG + div を直接注入し、
// ターゲット要素 (data-tutorial 属性が付いた実要素) を getBoundingClientRect
// で拾って同じ数式でハイライトを描く。オーバーレイの位置計算バグは
// TutorialOverlay と同じ数式で再現できる。
//
// dev server は `PORT=3100 npm run start` で先に上げておく前提。

import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import WebSocket from 'ws'

const CHROME_BIN = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const DEBUG_PORT = 9331
const OUT_DIR = 'Claude outputs/tutorial-2026-09-18'

// 各ステップの selector とページ URL。step 1 (welcome) はターゲット無しで
// SVG も出ないのでスキップし、target selector があるステップだけを撮る。
const STEPS = [
  {
    id: 'step2-search',
    label: 'STEP 2 検索バー',
    url: 'http://localhost:3100/',
    selector: '[data-tutorial="search"]',
  },
  {
    id: 'step3-etymology',
    label: 'STEP 3 語源ツリー',
    url: 'http://localhost:3100/word/component',
    selector: '[data-tutorial="etymology-tree"]',
  },
  {
    id: 'step4-pin',
    label: 'STEP 4 ピン止め',
    url: 'http://localhost:3100/word/company',
    selector: '[data-tutorial="pin-button"]',
  },
]

const VIEWPORTS = [
  { name: 'phone-390x844', width: 390, height: 844 },
  { name: 'tablet-800x1280', width: 800, height: 1280 },
]

mkdirSync(OUT_DIR, { recursive: true })

const userDataDir = join(tmpdir(), `chrome-tutorial-${Date.now()}`)
mkdirSync(userDataDir, { recursive: true })

const chrome = spawn(
  CHROME_BIN,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${userDataDir}`,
    'about:blank',
  ],
  { stdio: ['ignore', 'ignore', 'ignore'] },
)

async function wait(ms) {
  return new Promise((res) => setTimeout(res, ms))
}

async function fetchDebuggerVersion(retries = 40) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`http://localhost:${DEBUG_PORT}/json/version`)
      if (res.ok) return await res.json()
    } catch {}
    await wait(200)
  }
  throw new Error('Chrome DevTools did not become ready')
}

class CDPClient {
  constructor(ws) {
    this.ws = ws
    this.nextId = 1
    this.pending = new Map()
    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString())
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id)
        this.pending.delete(msg.id)
        if (msg.error) reject(new Error(JSON.stringify(msg.error)))
        else resolve(msg.result)
      }
    })
  }

  send(method, params = {}) {
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }
}

async function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url)
    ws.once('open', () => resolve(new CDPClient(ws)))
    ws.once('error', reject)
  })
}

// TutorialOverlay と同じ数式で spotlight を注入する。
// PADDING=10, ボーダー #009689 も同一。
const INJECT_SCRIPT = (selector) => `
(async () => {
  const PADDING = 10
  // ターゲットが見つかるまで待つ (word page の Cloud Run resolve が終わって
  // etymology tree が描画されるまで数秒かかることがある)。
  const findTarget = () => {
    const list = Array.from(document.querySelectorAll(${JSON.stringify(selector)}))
    return list.find((el) => {
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0
    }) || null
  }
  let target = findTarget()
  for (let i = 0; !target && i < 40; i++) {
    await new Promise((r) => setTimeout(r, 200))
    target = findTarget()
  }
  if (!target) {
    document.body.setAttribute('data-tutorial-mock-missing', ${JSON.stringify(selector)})
    return
  }
  // まずスクロールで画面内に入れる (auto で即位置確定させる)。
  target.scrollIntoView({ behavior: 'auto', block: 'center' })
  await new Promise((r) => setTimeout(r, 100))
  const r = target.getBoundingClientRect()
  const rect = {
    top: r.top - PADDING,
    left: r.left - PADDING,
    width: r.width + PADDING * 2,
    height: r.height + PADDING * 2,
  }
  // 既存 overlay があれば消す
  document.querySelectorAll('[data-tutorial-mock]').forEach((el) => el.remove())

  // SVG mask
  const svgNs = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(svgNs, 'svg')
  svg.setAttribute('data-tutorial-mock', 'svg')
  svg.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:100;pointer-events:none;'
  const defs = document.createElementNS(svgNs, 'defs')
  const mask = document.createElementNS(svgNs, 'mask')
  mask.setAttribute('id', 'tutorial-mock-mask')
  const white = document.createElementNS(svgNs, 'rect')
  white.setAttribute('width', '100%')
  white.setAttribute('height', '100%')
  white.setAttribute('fill', 'white')
  const black = document.createElementNS(svgNs, 'rect')
  black.setAttribute('x', String(rect.left))
  black.setAttribute('y', String(rect.top))
  black.setAttribute('width', String(rect.width))
  black.setAttribute('height', String(rect.height))
  black.setAttribute('rx', '12')
  black.setAttribute('ry', '12')
  black.setAttribute('fill', 'black')
  mask.appendChild(white)
  mask.appendChild(black)
  defs.appendChild(mask)
  svg.appendChild(defs)
  const dim = document.createElementNS(svgNs, 'rect')
  dim.setAttribute('width', '100%')
  dim.setAttribute('height', '100%')
  dim.setAttribute('fill', 'rgba(0,0,0,0.7)')
  dim.setAttribute('mask', 'url(#tutorial-mock-mask)')
  svg.appendChild(dim)
  document.body.appendChild(svg)

  // 枠 div
  const box = document.createElement('div')
  box.setAttribute('data-tutorial-mock', 'box')
  box.style.cssText = \`position:fixed;top:\${rect.top}px;left:\${rect.left}px;width:\${rect.width}px;height:\${rect.height}px;border-radius:12px;box-shadow:0 0 0 3px #009689,0 0 20px rgba(0,150,137,0.4);z-index:100;pointer-events:none;\`
  document.body.appendChild(box)

  // 検証用に target の rect も残しておく
  document.body.setAttribute('data-tutorial-mock-rect', JSON.stringify({
    target: r,
    overlay: rect,
  }))
})();
`

async function screenshotStep(step, viewport, target) {
  const ws = await connect(target.webSocketDebuggerUrl)
  await ws.send('Page.enable')
  await ws.send('Runtime.enable')
  await ws.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 2,
    mobile: true,
  })
  await ws.send('Page.navigate', { url: step.url })
  // 初回コンパイル + JS + データ fetch 待ち
  await wait(5000)

  // モーダル・ログイン要求などを退ける
  await ws.send('Runtime.evaluate', {
    expression: `
      const h2 = [...document.querySelectorAll('h2')].find((h) => h.textContent && h.textContent.includes('アカウント登録'))
      if (h2) {
        const root = h2.closest('.fixed')
        if (root) root.remove()
      }
    `,
  })

  const inject = await ws.send('Runtime.evaluate', {
    expression: INJECT_SCRIPT(step.selector),
    awaitPromise: true,
    returnByValue: true,
  })
  if (inject.exceptionDetails) {
    console.log(`[${viewport.name}/${step.id}] inject failed:`, inject.exceptionDetails.text)
  }
  await wait(400)

  const check = await ws.send('Runtime.evaluate', {
    expression: `JSON.stringify({
      missing: document.body.getAttribute('data-tutorial-mock-missing'),
      rect: document.body.getAttribute('data-tutorial-mock-rect'),
    })`,
    returnByValue: true,
  })
  console.log(`[${viewport.name}/${step.id}] ${check.result.value}`)

  const shot = await ws.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  })
  const outName = `${viewport.name}-${step.id}.png`
  writeFileSync(join(OUT_DIR, outName), Buffer.from(shot.data, 'base64'))
  console.log(`saved ${OUT_DIR}/${outName}`)
  ws.ws.close()
}

async function main() {
  try {
    await fetchDebuggerVersion()
    for (const vp of VIEWPORTS) {
      for (const step of STEPS) {
        const listRes = await fetch(
          `http://localhost:${DEBUG_PORT}/json/new?about:blank`,
          { method: 'PUT' },
        )
        const target = await listRes.json()
        try {
          await screenshotStep(step, vp, target)
        } catch (e) {
          console.log(`[${vp.name}/${step.id}] failed: ${e.message}`)
        }
        await fetch(`http://localhost:${DEBUG_PORT}/json/close/${target.id}`).catch(() => {})
      }
    }
  } finally {
    chrome.kill('SIGTERM')
  }
}

main().catch((err) => {
  console.error('SCRIPT FAILED:', err)
  chrome.kill('SIGTERM')
  process.exit(1)
})
