'use client'

import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { HiDownload, HiRefresh } from 'react-icons/hi'
import { makeStoreZip } from './zipStore'

type Accent = 'JA' | 'EN_GB' | 'EN_US'

type Clip = {
  id: string
  accent: Accent
  text: string
  status: 'idle' | 'generating' | 'done' | 'error'
  audioUrl?: string
  error?: string
}

// gpt-4o-mini-tts の全 voice に性別メモを付けた UI 用リスト。
// 性別は OpenAI 公式 docs + 実聴の感触をベースにした参考値。
const VOICES = [
  { id: 'shimmer', label: 'shimmer (女性・やわらか)' },
  { id: 'nova', label: 'nova (女性・若め)' },
  { id: 'coral', label: 'coral (女性・あたたかみ)' },
  { id: 'alloy', label: 'alloy (中性)' },
  { id: 'sage', label: 'sage (中性)' },
  { id: 'verse', label: 'verse (表現豊か)' },
  { id: 'ash', label: 'ash (男性)' },
  { id: 'ballad', label: 'ballad (男性・落ち着き)' },
  { id: 'echo', label: 'echo (男性・クリア)' },
  { id: 'fable', label: 'fable (男性・物語調)' },
  { id: 'onyx', label: 'onyx (男性・低音)' },
] as const
type Voice = typeof VOICES[number]['id']

const ACCENTS: Record<Accent, { label: string; prefix: string; instructions: string }> = {
  JA: {
    label: '日本語',
    prefix: 'JA',
    instructions: '自然な日本語で、落ち着いた先生の口調で読んでください。優しく、聞き手に語りかけるトーン。',
  },
  EN_GB: {
    label: 'イギリス英語',
    prefix: 'EN',
    instructions: 'Speak in a clear, natural British English accent with standard Received Pronunciation. Natural narration pace.',
  },
  EN_US: {
    label: 'アメリカ英語',
    prefix: 'EN',
    instructions: 'Speak in a clear, natural American English accent. Natural narration pace.',
  },
}

const DEFAULT_SCRIPT = `JA: こんにちは、Cuppa English です。
EN: Today we learn English through etymology.
JA: 今日は語源から単語を覚えていきましょう。`

function parseScript(raw: string, defaultAccent: Accent, enAccent: Accent): { accent: Accent; text: string }[] {
  const out: { accent: Accent; text: string }[] = []
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const m = trimmed.match(/^(JA|EN)\s*[:：]\s*(.*)$/i)
    if (m) {
      const text = m[2].trim()
      if (!text) continue
      const prefix = m[1].toUpperCase()
      // JA: → 日本語、EN: → 選択中の英語アクセント
      const accent: Accent = prefix === 'JA' ? 'JA' : enAccent
      out.push({ accent, text })
    } else {
      out.push({ accent: defaultAccent, text: trimmed })
    }
  }
  return out
}

function newId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function makeFilename(index1: number, text: string): string {
  const head = text.slice(0, 10).replace(/[\\/:*?"<>|\n\r\t]/g, '_')
  return `${String(index1).padStart(3, '0')}_${head}.mp3`
}

export default function NarrationClient() {
  const [script, setScript] = useState(DEFAULT_SCRIPT)
  const [voice, setVoice] = useState<Voice>('shimmer')
  const [defaultAccent, setDefaultAccent] = useState<Accent>('JA')
  const [enAccent, setEnAccent] = useState<Accent>('EN_GB')
  const [speed, setSpeed] = useState(1.0)
  const [clips, setClips] = useState<Clip[]>([])
  const [running, setRunning] = useState(false)

  const parsed = useMemo(
    () => parseScript(script, defaultAccent, enAccent),
    [script, defaultAccent, enAccent],
  )

  async function callApi(text: string, accent: Accent): Promise<{ audioUrl: string } | { error: string }> {
    try {
      const res = await fetch('/api/admin/narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice,
          instructions: ACCENTS[accent].instructions,
          speed,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) {
        return { error: data?.reason || `HTTP ${res.status}` }
      }
      return { audioUrl: data.audioUrl as string }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'fetch failed' }
    }
  }

  function applyResult(id: string, result: { audioUrl: string } | { error: string }) {
    setClips(prev => prev.map(c => {
      if (c.id !== id) return c
      if ('error' in result) return { ...c, status: 'error', error: result.error }
      return { ...c, status: 'done', audioUrl: result.audioUrl, error: undefined }
    }))
  }

  async function generateAll() {
    if (parsed.length === 0) { toast.error('スクリプトが空'); return }
    setRunning(true)
    const initial: Clip[] = parsed.map(p => ({
      id: newId(),
      accent: p.accent,
      text: p.text,
      status: 'idle',
    }))
    setClips(initial)

    let ok = 0, ng = 0
    for (const clip of initial) {
      setClips(prev => prev.map(c => c.id === clip.id ? { ...c, status: 'generating' } : c))
      const result = await callApi(clip.text, clip.accent)
      applyResult(clip.id, result)
      if ('error' in result) ng++
      else ok++
    }
    setRunning(false)
    toast.success(`完了: ${ok} 件 / 失敗 ${ng} 件`)
  }

  async function generateOne() {
    const first = parsed[0]
    if (!first) { toast.error('スクリプトが空'); return }
    const id = newId()
    setClips([{ id, accent: first.accent, text: first.text, status: 'generating' }])
    const result = await callApi(first.text, first.accent)
    applyResult(id, result)
    if ('error' in result) toast.error(`失敗: ${result.error}`)
  }

  async function regenerate(id: string) {
    const clip = clips.find(c => c.id === id)
    if (!clip) return
    setClips(prev => prev.map(c => c.id === id ? { ...c, status: 'generating', error: undefined } : c))
    const result = await callApi(clip.text, clip.accent)
    applyResult(id, result)
    if ('error' in result) toast.error(`失敗: ${result.error}`)
  }

  async function downloadOne(clip: Clip, index1: number) {
    if (!clip.audioUrl) return
    // 別オリジン (Supabase Storage) の mp3 を download 属性付きで保存するため、
    // 一度 blob に落としてから anchor でファイル名付き保存する。
    try {
      const res = await fetch(clip.audioUrl)
      const blob = await res.blob()
      const objUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objUrl
      a.download = makeFilename(index1, clip.text)
      a.click()
      setTimeout(() => URL.revokeObjectURL(objUrl), 10_000)
    } catch (e) {
      toast.error(`DL 失敗: ${e instanceof Error ? e.message : 'fetch failed'}`)
    }
  }

  async function downloadZip() {
    const done = clips.filter(c => c.status === 'done' && c.audioUrl)
    if (done.length === 0) { toast.error('生成済みの行がない'); return }
    try {
      const entries = await Promise.all(
        done.map(async (c, i) => {
          const res = await fetch(c.audioUrl!)
          const buf = new Uint8Array(await res.arrayBuffer())
          return { name: makeFilename(i + 1, c.text), data: buf }
        })
      )
      const zip = makeStoreZip(entries)
      const url = URL.createObjectURL(zip)
      const a = document.createElement('a')
      a.href = url
      a.download = `narration_${new Date().toISOString().slice(0, 10)}.zip`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch (e) {
      toast.error(`ZIP 失敗: ${e instanceof Error ? e.message : 'fetch failed'}`)
    }
  }

  const hasAnyDone = clips.some(c => c.status === 'done')

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-[960px] mx-auto px-4 py-6 flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-950">Narration (admin)</h1>
          <span className="text-xs text-muted">gpt-4o-mini-tts · 500 call/day</span>
        </header>

        {/* 音声設定カード: voice / 英語アクセント / デフォルト言語 / speed */}
        <section className="bg-white rounded-xl border border-line px-5 py-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted shrink-0">音声</span>
              <select
                value={voice}
                onChange={e => setVoice(e.target.value as Voice)}
                className="border border-line rounded-md px-3 h-9 text-sm bg-white"
              >
                {VOICES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted shrink-0">英語アクセント</span>
              <select
                value={enAccent}
                onChange={e => setEnAccent(e.target.value as Accent)}
                className="border border-line rounded-md px-3 h-9 text-sm bg-white"
              >
                <option value="EN_GB">イギリス英語</option>
                <option value="EN_US">アメリカ英語</option>
              </select>
            </label>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted shrink-0">デフォルト言語</span>
              <div className="inline-flex rounded-full border border-line overflow-hidden">
                {(['JA', 'EN_GB'] as Accent[]).map(a => {
                  const selected = defaultAccent === a || (a === 'EN_GB' && defaultAccent === 'EN_US')
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setDefaultAccent(a === 'EN_GB' ? enAccent : a)}
                      className={`px-4 h-8 text-sm ${selected ? 'bg-primary text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
                    >
                      {a === 'JA' ? '日本語' : '英語'}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted shrink-0">スピード {speed.toFixed(2)}x</span>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.05}
              value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              className="flex-1 max-w-[320px]"
            />
            <div className="flex gap-1">
              {[0.75, 1.0, 1.25, 1.5].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  className="text-xs px-2 h-7 rounded-full border border-line hover:bg-gray-50"
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-muted">
            行頭 <code className="font-mono">JA:</code> / <code className="font-mono">EN:</code> で行ごとのアクセントを上書き。prefix 無しはデフォルト言語。
          </div>
        </section>

        {/* 生成ボタン群 */}
        <section className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={generateOne}
            disabled={running}
            className="inline-flex items-center h-9 px-4 rounded-full text-sm font-medium bg-white border border-primary text-primary hover:bg-primary-light disabled:opacity-40"
          >
            1行だけ試す
          </button>
          <button
            type="button"
            onClick={generateAll}
            disabled={running}
            className="inline-flex items-center h-9 px-5 rounded-full text-sm font-medium bg-primary text-white hover:bg-primary-hover disabled:opacity-40"
          >
            {running ? '生成中…' : '全行生成'}
          </button>
          <button
            type="button"
            onClick={downloadZip}
            disabled={!hasAnyDone}
            className="inline-flex items-center gap-1 h-9 px-4 rounded-full text-sm font-medium text-primary hover:bg-primary-light disabled:opacity-40"
          >
            <HiDownload className="size-4" />
            ZIP
          </button>
          <span className="ml-auto text-xs text-muted">{parsed.length} 行</span>
        </section>

        {/* 原稿カード */}
        <section className="bg-white rounded-xl border border-line px-5 py-4 flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-900">原稿 (1行 = 1クリップ)</label>
          <textarea
            value={script}
            onChange={e => setScript(e.target.value)}
            rows={10}
            spellCheck={false}
            className="w-full border border-line rounded-md px-3 py-2 text-sm font-mono leading-relaxed"
          />
        </section>

        {/* 生成結果 */}
        {clips.length > 0 && (
          <section className="flex flex-col gap-2">
            {clips.map((clip, i) => {
              const accent = ACCENTS[clip.accent]
              return (
                <div key={clip.id} className="bg-white rounded-xl border border-line px-5 py-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="shrink-0 font-mono text-xs text-muted w-10">
                      {String(i + 1).padStart(3, '0')}
                    </span>
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded-full border border-line text-gray-700">
                      {accent.label}
                    </span>
                    <span className="flex-1 min-w-0 text-sm text-gray-950 break-words">{clip.text}</span>
                    <div className="shrink-0 flex items-center gap-1">
                      {clip.status === 'generating' && <span className="text-xs text-muted mr-2">生成中…</span>}
                      {clip.status === 'error' && <span className="text-xs text-red-600 mr-2">{clip.error}</span>}
                      <button
                        type="button"
                        onClick={() => downloadOne(clip, i + 1)}
                        disabled={clip.status !== 'done'}
                        className="size-9 inline-flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent"
                        aria-label="ダウンロード"
                      >
                        <HiDownload className="size-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => regenerate(clip.id)}
                        disabled={clip.status === 'generating' || running}
                        className="size-9 inline-flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent"
                        aria-label="作り直し"
                      >
                        <HiRefresh className="size-5" />
                      </button>
                    </div>
                  </div>
                  {clip.status === 'done' && clip.audioUrl && (
                    <audio controls preload="none" src={clip.audioUrl} className="w-full h-10" />
                  )}
                </div>
              )
            })}
          </section>
        )}
      </div>
    </div>
  )
}
