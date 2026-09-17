// Take before/after screenshots of /callback and /auth/app-return.
// BEFORE = current origin/main (production URL). AFTER = local prod server on :3100.

import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import WebSocket from 'ws'

const CHROME_BIN = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const DEBUG_PORT = 9331
const OUT_DIR = 'Claude outputs/auth-result-2026-09-17'

const TARGETS = [
  { name: 'before-callback-error', url: 'https://www.rootlink.app/callback' },
  { name: 'before-callback-confirmed', url: 'https://www.rootlink.app/callback?code=deadbeef' },
  { name: 'before-app-return-success', url: 'https://www.rootlink.app/auth/app-return' },
  { name: 'before-app-return-error', url: 'https://www.rootlink.app/auth/app-return?error=access_denied' },
  { name: 'after-callback-error', url: 'http://localhost:3100/callback' },
  { name: 'after-callback-confirmed', url: 'http://localhost:3100/callback?code=deadbeef' },
  { name: 'after-app-return-success', url: 'http://localhost:3100/auth/app-return' },
  { name: 'after-app-return-error', url: 'http://localhost:3100/auth/app-return?error=access_denied' },
]

const VIEWPORT = { width: 390, height: 844 }

mkdirSync(OUT_DIR, { recursive: true })

const userDataDir = join(tmpdir(), `chrome-auth-result-${Date.now()}`)
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

async function wait(ms) { return new Promise((r) => setTimeout(r, ms)) }

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

async function screenshotTarget({ name, url }) {
  const listRes = await fetch(`http://localhost:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' })
  const target = await listRes.json()
  const ws = await connect(target.webSocketDebuggerUrl)
  await ws.send('Page.enable')
  await ws.send('Runtime.enable')
  await ws.send('Emulation.setDeviceMetricsOverride', {
    width: VIEWPORT.width, height: VIEWPORT.height,
    deviceScaleFactor: 2, mobile: true,
  })
  await ws.send('Page.navigate', { url })
  await wait(2500)
  const shot = await ws.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  writeFileSync(join(OUT_DIR, `${name}.png`), Buffer.from(shot.data, 'base64'))
  console.log(`saved ${OUT_DIR}/${name}.png`)
  ws.ws.close()
  await fetch(`http://localhost:${DEBUG_PORT}/json/close/${target.id}`).catch(() => {})
}

async function main() {
  try {
    await fetchDebuggerVersion()
    for (const t of TARGETS) {
      try { await screenshotTarget(t) }
      catch (err) { console.error(`FAILED ${t.name}: ${err.message}`) }
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
