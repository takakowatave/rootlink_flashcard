// /wordlist をタブレットとスマホの viewport でスクリーンショットする。
// Task: 2026-09-18 クイズ設定画面のタブレットレイアウト調整の確認用。
//
// dev server は `PORT=3100 npm run dev` で先に上げておく前提。

import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import WebSocket from 'ws'

const CHROME_BIN =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const DEBUG_PORT = 9328
const APP_URL = 'http://localhost:3100/wordlist'
const OUT_DIR = 'Claude outputs/quiz-layout-2026-09-18'

const VIEWPORTS = [
  { name: 'phone-390x844', width: 390, height: 844 },
  { name: 'tablet-800x1280', width: 800, height: 1280 },
]

mkdirSync(OUT_DIR, { recursive: true })

const userDataDir = join(tmpdir(), `chrome-quizlayout-${Date.now()}`)
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
    } catch {
      /* retry */
    }
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

async function screenshotViewport({ name, width, height }, target) {
  const ws = await connect(target.webSocketDebuggerUrl)
  await ws.send('Page.enable')
  await ws.send('Runtime.enable')
  await ws.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 2,
    mobile: true,
  })
  await ws.send('Page.navigate', { url: APP_URL })
  await wait(4000)
  // 未ログインだと SignupRequiredModal が乗ってレイアウト確認の邪魔になるので
  // 背景の "アカウント登録が必要です" 見出しを含むモーダルを DOM から取り除く。
  await ws.send('Runtime.evaluate', {
    expression: `
      const h2 = [...document.querySelectorAll('h2')]
        .find((h) => h.textContent && h.textContent.includes('アカウント登録が必要'))
      if (h2) {
        const root = h2.closest('.fixed')
        if (root) root.remove()
      }
    `,
  })
  await wait(300)
  const shot = await ws.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  })
  writeFileSync(join(OUT_DIR, `${name}.png`), Buffer.from(shot.data, 'base64'))
  console.log(`saved ${OUT_DIR}/${name}.png (${width}x${height})`)
  ws.ws.close()
}

async function main() {
  try {
    await fetchDebuggerVersion()
    for (const vp of VIEWPORTS) {
      const listRes = await fetch(
        `http://localhost:${DEBUG_PORT}/json/new?about:blank`,
        { method: 'PUT' },
      )
      const target = await listRes.json()
      await screenshotViewport(vp, target)
      await fetch(
        `http://localhost:${DEBUG_PORT}/json/close/${target.id}`,
      ).catch(() => {})
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
