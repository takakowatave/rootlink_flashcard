'use client'

import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { makeStoreZip } from './zipStore'

type Lang = 'JA' | 'EN'

type Clip = {
  id: string
  lang: Lang
  text: string
  status: 'idle' | 'generating' | 'done' | 'error'
  audioBase64?: string
  bytes?: number
  error?: string
  url?: string // ObjectURL (play/download 用)
}

// gpt-4o-mini-tts で選べる voice。
const VOICES = [
  'alloy', 'ash', 'ballad', 'coral', 'echo',
  'fable', 'onyx', 'nova', 'sage', 'shimmer', 'verse',
] as const

const DEFAULT_SCRIPT = `JA: こんにちは、先生の Cuppa English です。
JA: 今日は語源から単語を覚えていきましょう。
EN: Let's learn English through etymology.`

const DEFAULT_INSTRUCTIONS =
  '落ち着いた日本語の先生の口調で。丁寧すぎず、優しく聞き手に語りかけるトーン。やや明るく、ゆっくりめのテンポで。'

// gpt-4o-mini-tts の公称価格 (OpenAI): 約 $0.015 / 1 分音声。
// 日本語で 1 分 ≒ 300 字 と仮定して、文字単価の荒い見積もり ($/char)。
// あくまで目安 (事前表示用)。実コストは OpenAI のダッシュボードで確認する。
const USD_PER_CHAR = 0.015 / 300
const USD_JPY = 155

function estimateCost(chars: number): { usd: number; jpy: number } {
  const usd = chars * USD_PER_CHAR
  return { usd, jpy: usd * USD_JPY }
}

// 「通し番号_先頭10文字.mp3」のファイル名。1-origin 3 桁ゼロ埋め。
// Windows / macOS で問題になる記号は _ に落とす。
function makeFilename(index1: number, text: string): string {
  const head = text.slice(0, 10).replace(/[\\/:*?"<>|\n\r\t]/g, '_')
  return `${String(index1).padStart(3, '0')}_${head}.mp3`
}

function parseScript(raw: string): { lang: Lang; text: string }[] {
  const out: { lang: Lang; text: string }[] = []
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const m = trimmed.match(/^(JA|EN)\s*[:：]\s*(.*)$/i)
    if (m) {
      const text = m[2].trim()
      if (text) out.push({ lang: m[1].toUpperCase() as Lang, text })
    } else {
      // prefix 無しは JA 扱い
      out.push({ lang: 'JA', text: trimmed })
    }
  }
  return out
}

function base64ToUint8(b64: string): Uint8Array {
  const bin = atob(b64)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return buf
}

function newId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export default function NarrationClient() {
  const [script, setScript] = useState(DEFAULT_SCRIPT)
  const [voice, setVoice] = useState<typeof VOICES[number]>('alloy')
  const [instructions, setInstructions] = useState(DEFAULT_INSTRUCTIONS)
  const [skipEn, setSkipEn] = useState(true)
  const [clips, setClips] = useState<Clip[]>([])
  const [bulkRunning, setBulkRunning] = useState(false)

  const parsed = useMemo(() => parseScript(script), [script])
  const targeted = useMemo(
    () => parsed.filter(p => (skipEn ? p.lang !== 'EN' : true)),
    [parsed, skipEn],
  )
  const totalChars = useMemo(
    () => targeted.reduce((sum, p) => sum + p.text.length, 0),
    [targeted],
  )
  const cost = useMemo(() => estimateCost(totalChars), [totalChars])

  async function callApi(text: string): Promise<{ base64: string; bytes: number } | { error: string }> {
    try {
      const res = await fetch('/api/admin/narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, instructions }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) {
        return { error: data?.reason || `HTTP ${res.status}` }
      }
      return { base64: data.audioBase64, bytes: data.bytes }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'fetch failed' }
    }
  }

  function applyResult(id: string, text: string, result: { base64: string; bytes: number } | { error: string }) {
    setClips(prev => prev.map(c => {
      if (c.id !== id) return c
      if ('error' in result) {
        return { ...c, status: 'error', error: result.error }
      }
      // 以前の URL を revoke
      if (c.url) URL.revokeObjectURL(c.url)
      const blob = new Blob([base64ToUint8(result.base64) as BlobPart], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      return { ...c, status: 'done', audioBase64: result.base64, bytes: result.bytes, url, text, error: undefined }
    }))
  }

  // ---- 1 行だけ生成 (動作確認) ----
  async function generateFirstOnly() {
    const first = targeted[0]
    if (!first) {
      toast.error('スクリプトが空')
      return
    }
    const id = newId()
    setClips([{ id, lang: first.lang, text: first.text, status: 'generating' }])
    const result = await callApi(first.text)
    applyResult(id, first.text, result)
    if ('error' in result) toast.error(`失敗: ${result.error}`)
    else toast.success('生成しました')
  }

  // ---- 全行まとめて生成 ----
  async function generateAll() {
    if (targeted.length === 0) {
      toast.error('スクリプトが空')
      return
    }
    setBulkRunning(true)
    const initial: Clip[] = targeted.map(p => ({
      id: newId(),
      lang: p.lang,
      text: p.text,
      status: 'idle',
    }))
    setClips(initial)

    let okCount = 0
    let ngCount = 0
    for (const clip of initial) {
      setClips(prev => prev.map(c => c.id === clip.id ? { ...c, status: 'generating' } : c))
      const result = await callApi(clip.text)
      applyResult(clip.id, clip.text, result)
      if ('error' in result) ngCount++
      else okCount++
    }
    setBulkRunning(false)
    toast.success(`完了: ${okCount} 件 / 失敗 ${ngCount} 件`)
  }

  // ---- 1 行再生成 ----
  async function regenerate(id: string) {
    const clip = clips.find(c => c.id === id)
    if (!clip) return
    setClips(prev => prev.map(c => c.id === id ? { ...c, status: 'generating', error: undefined } : c))
    const result = await callApi(clip.text)
    applyResult(id, clip.text, result)
    if ('error' in result) toast.error(`失敗: ${result.error}`)
  }

  // ---- 1 行ダウンロード ----
  function downloadOne(clip: Clip, index1: number) {
    if (!clip.url) return
    const a = document.createElement('a')
    a.href = clip.url
    a.download = makeFilename(index1, clip.text)
    a.click()
  }

  // ---- 全行 zip ダウンロード ----
  function downloadZip() {
    const done = clips.filter(c => c.status === 'done' && c.audioBase64)
    if (done.length === 0) {
      toast.error('生成済みの行がない')
      return
    }
    const entries = done.map((c, i) => ({
      name: makeFilename(i + 1, c.text),
      data: base64ToUint8(c.audioBase64!),
    }))
    const zip = makeStoreZip(entries)
    const url = URL.createObjectURL(zip)
    const a = document.createElement('a')
    a.href = url
    a.download = `narration_${new Date().toISOString().slice(0, 10)}.zip`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-[860px] mx-auto px-4 py-6 flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-gray-950">Narration (admin)</h1>
          <p className="text-sm text-muted">
            Cuppa English 長尺動画用の日本語ナレーションを gpt-4o-mini-tts で生成します。
          </p>
        </header>

        <section className="flex flex-col gap-3 bg-white rounded-lg border border-line p-4">
          <label className="text-sm font-medium text-gray-900">原稿 (1 行 = 1 クリップ、行頭 JA: / EN:)</label>
          <textarea
            value={script}
            onChange={e => setScript(e.target.value)}
            rows={10}
            className="w-full border border-line rounded-md px-3 py-2 text-sm font-mono leading-relaxed"
            spellCheck={false}
          />
          <label className="flex items-center gap-2 text-sm text-gray-900">
            <input type="checkbox" checked={skipEn} onChange={e => setSkipEn(e.target.checked)} />
            EN 行は今回は生成しない (skip)
          </label>
        </section>

        <section className="flex flex-col gap-3 bg-white rounded-lg border border-line p-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-900">Voice</label>
            <select
              value={voice}
              onChange={e => setVoice(e.target.value as typeof VOICES[number])}
              className="border border-line rounded-md px-3 py-2 text-sm w-48"
            >
              {VOICES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-900">Instructions (読み方の指示)</label>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              rows={3}
              className="w-full border border-line rounded-md px-3 py-2 text-sm"
            />
          </div>
        </section>

        <section className="flex flex-col gap-3 bg-white rounded-lg border border-line p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            <span>対象 <b>{targeted.length}</b> 行</span>
            <span>合計 <b>{totalChars}</b> 文字</span>
            <span>概算 <b>${cost.usd.toFixed(4)}</b> (≒ ¥{cost.jpy.toFixed(1)})</span>
          </div>
          <p className="text-xs text-muted">
            料金は OpenAI gpt-4o-mini-tts の公称 $0.015/分 × 日本語 300字/分 で仮計算。1日 500 call の server-side 上限あり。
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={generateFirstOnly}
              disabled={bulkRunning || targeted.length === 0}
              className="inline-flex items-center justify-center h-10 px-5 rounded-full text-sm font-medium bg-white border border-primary text-primary hover:bg-primary-light disabled:opacity-40 disabled:cursor-not-allowed"
            >
              1 行だけ試す (動作確認)
            </button>
            <button
              type="button"
              onClick={generateAll}
              disabled={bulkRunning || targeted.length === 0}
              className="inline-flex items-center justify-center h-10 px-5 rounded-full text-sm font-medium bg-primary text-white hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {bulkRunning ? '生成中…' : '全行生成'}
            </button>
            <button
              type="button"
              onClick={downloadZip}
              disabled={clips.every(c => c.status !== 'done')}
              className="inline-flex items-center justify-center h-10 px-5 rounded-full text-sm font-medium text-primary hover:bg-primary-light disabled:opacity-40 disabled:cursor-not-allowed"
            >
              zip で全行ダウンロード
            </button>
          </div>
        </section>

        {clips.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-gray-900">結果</h2>
            <ul className="flex flex-col gap-2">
              {clips.map((clip, i) => (
                <li key={clip.id} className="bg-white rounded-lg border border-line p-3 flex flex-col gap-2">
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 text-xs font-mono text-muted mt-1 w-10">
                      {String(i + 1).padStart(3, '0')}
                    </span>
                    <span className="shrink-0 text-xs font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 mt-1">
                      {clip.lang}
                    </span>
                    <span className="text-sm text-gray-950 flex-1 break-words">{clip.text}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pl-[52px]">
                    {clip.status === 'generating' && <span className="text-xs text-muted">生成中…</span>}
                    {clip.status === 'error' && <span className="text-xs text-red-600">失敗: {clip.error}</span>}
                    {clip.status === 'done' && clip.url && (
                      <>
                        <audio controls src={clip.url} className="h-8" />
                        <span className="text-xs text-muted">{clip.bytes?.toLocaleString()} B</span>
                      </>
                    )}
                    <div className="ml-auto flex gap-1">
                      <button
                        type="button"
                        onClick={() => regenerate(clip.id)}
                        disabled={clip.status === 'generating' || bulkRunning}
                        className="text-xs px-3 h-7 rounded-full text-primary hover:bg-primary-light disabled:opacity-40"
                      >
                        作り直し
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadOne(clip, i + 1)}
                        disabled={clip.status !== 'done'}
                        className="text-xs px-3 h-7 rounded-full text-primary hover:bg-primary-light disabled:opacity-40"
                      >
                        ダウンロード
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
