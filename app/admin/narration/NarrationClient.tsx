'use client'

import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { HiPlay, HiDownload, HiRefresh } from 'react-icons/hi'
import { makeStoreZip } from './zipStore'

type Lang = 'JA' | 'EN'

type Clip = {
  id: string
  lang: Lang
  text: string
  status: 'idle' | 'generating' | 'done' | 'error'
  audioUrl?: string
  bytes?: number
  error?: string
}

// gpt-4o-mini-tts で選べる voice。
const VOICES = [
  'alloy', 'ash', 'ballad', 'coral', 'echo',
  'fable', 'onyx', 'nova', 'sage', 'shimmer', 'verse',
] as const
type Voice = typeof VOICES[number]

// 言語ごとのデフォルト voice と instructions。
// kiko が「イギリス英語」「日本語」両方選べる + 最低限 download、を最優先。
const LANG_PRESETS: Record<Lang, { voice: Voice; instructions: string; label: string }> = {
  JA: {
    voice: 'shimmer',
    instructions: '落ち着いた日本語の先生の口調で。優しく聞き手に語りかけるトーン。やや明るく、ゆっくりめのテンポで。',
    label: '日本語',
  },
  EN: {
    voice: 'shimmer',
    instructions: 'Read in a clear British English accent. Speak as a whole sentence with natural intonation and pacing.',
    label: 'イギリス英語',
  },
}

const DEFAULT_SCRIPT = `JA: こんにちは、Cuppa English です。
EN: Today we learn English through etymology.
JA: 今日は語源から単語を覚えていきましょう。`

function parseScript(raw: string, defaultLang: Lang): { lang: Lang; text: string }[] {
  const out: { lang: Lang; text: string }[] = []
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const m = trimmed.match(/^(JA|EN)\s*[:：]\s*(.*)$/i)
    if (m) {
      const text = m[2].trim()
      if (text) out.push({ lang: m[1].toUpperCase() as Lang, text })
    } else {
      out.push({ lang: defaultLang, text: trimmed })
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
  const [defaultLang, setDefaultLang] = useState<Lang>('JA')
  const [clips, setClips] = useState<Clip[]>([])
  const [running, setRunning] = useState(false)

  const parsed = useMemo(() => parseScript(script, defaultLang), [script, defaultLang])

  async function callApi(text: string, lang: Lang): Promise<{ audioUrl: string } | { error: string }> {
    const preset = LANG_PRESETS[lang]
    try {
      const res = await fetch('/api/admin/narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: preset.voice,
          instructions: preset.instructions,
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
      if ('error' in result) {
        return { ...c, status: 'error', error: result.error }
      }
      return { ...c, status: 'done', audioUrl: result.audioUrl, error: undefined }
    }))
  }

  async function generateAll() {
    if (parsed.length === 0) {
      toast.error('スクリプトが空')
      return
    }
    setRunning(true)
    const initial: Clip[] = parsed.map(p => ({
      id: newId(),
      lang: p.lang,
      text: p.text,
      status: 'idle',
    }))
    setClips(initial)

    let ok = 0, ng = 0
    for (const clip of initial) {
      setClips(prev => prev.map(c => c.id === clip.id ? { ...c, status: 'generating' } : c))
      const result = await callApi(clip.text, clip.lang)
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
    setClips([{ id, lang: first.lang, text: first.text, status: 'generating' }])
    const result = await callApi(first.text, first.lang)
    applyResult(id, result)
    if ('error' in result) toast.error(`失敗: ${result.error}`)
  }

  async function regenerate(id: string) {
    const clip = clips.find(c => c.id === id)
    if (!clip) return
    setClips(prev => prev.map(c => c.id === id ? { ...c, status: 'generating', error: undefined } : c))
    const result = await callApi(clip.text, clip.lang)
    applyResult(id, result)
    if ('error' in result) toast.error(`失敗: ${result.error}`)
  }

  function play(url: string) {
    new Audio(url).play().catch(() => {})
  }

  async function downloadOne(clip: Clip, index1: number) {
    if (!clip.audioUrl) return
    // 直リンクで download 属性を付けても、別オリジン (Supabase Storage) だと
    // ブラウザが別タブで開く挙動になる。一度 blob に落として anchor から保存する。
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

        {/* 設定カード: 言語トグル + 生成ボタン */}
        <section className="bg-white rounded-xl border border-line px-5 py-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">デフォルト言語</span>
            <div className="inline-flex rounded-full border border-line overflow-hidden">
              {(['JA', 'EN'] as Lang[]).map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setDefaultLang(l)}
                  className={`px-4 h-8 text-sm ${defaultLang === l ? 'bg-primary text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
                >
                  {LANG_PRESETS[l].label}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted">prefix 無しの行に適用。<code className="font-mono">JA:</code> / <code className="font-mono">EN:</code> で行ごと上書き</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
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
          </div>
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
          <div className="text-xs text-muted">{parsed.length} 行</div>
        </section>

        {/* 生成結果: ブロック */}
        {clips.length > 0 && (
          <section className="flex flex-col gap-2">
            {clips.map((clip, i) => {
              const preset = LANG_PRESETS[clip.lang]
              return (
                <div key={clip.id} className="bg-white rounded-xl border border-line px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="shrink-0 font-mono text-xs text-muted w-10">
                      {String(i + 1).padStart(3, '0')}
                    </span>
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded-full border border-line text-gray-700">
                      {preset.label}
                    </span>
                    <span className="flex-1 min-w-0 text-sm text-gray-950 break-words">{clip.text}</span>
                    <div className="shrink-0 flex items-center gap-1">
                      {clip.status === 'generating' && <span className="text-xs text-muted mr-2">生成中…</span>}
                      {clip.status === 'error' && <span className="text-xs text-red-600 mr-2">{clip.error}</span>}
                      {clip.status === 'done' && clip.audioUrl && (
                        <button
                          type="button"
                          onClick={() => play(clip.audioUrl!)}
                          className="size-9 inline-flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-700"
                          aria-label="再生"
                        >
                          <HiPlay className="size-5" />
                        </button>
                      )}
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
                </div>
              )
            })}
          </section>
        )}
      </div>
    </div>
  )
}
