import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkAdminServer } from '@/lib/adminAuth'

// Cuppa English 長尺動画用ナレーション生成。
// - 管理者だけが叩ける (checkAdminServer)
// - gpt-4o-mini-tts を server 側から呼ぶ
// - tts_daily_counters.kind='narration' で日次 call 数ガード (bump_tts_counter RPC)
// - レスポンスは application/json { ok, audioBase64, mime, bytes }

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 1 日あたりの narration TTS call 上限。管理者手動運用なのでやや緩め。
const NARRATION_DAILY_LIMIT = 500

// gpt-4o-mini-tts で使える voice。OpenAI 公式リスト。
const ALLOWED_VOICES = [
  'alloy', 'ash', 'ballad', 'coral', 'echo',
  'fable', 'onyx', 'nova', 'sage', 'shimmer', 'verse',
] as const
type Voice = typeof ALLOWED_VOICES[number]

function currentPeriodDateJst(): string {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return jst.toISOString().slice(0, 10)
}

export async function POST(req: Request) {
  const admin = await checkAdminServer()
  if (!admin.ok) {
    return NextResponse.json(
      { ok: false, reason: admin.reason },
      { status: admin.reason === 'UNAUTHENTICATED' ? 401 : 403 },
    )
  }

  const openaiKey = process.env.OPENAI_API_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!openaiKey || !supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { ok: false, reason: 'MISCONFIGURED' },
      { status: 500 },
    )
  }

  let body: {
    text?: unknown
    voice?: unknown
    instructions?: unknown
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, reason: 'BAD_JSON' }, { status: 400 })
  }

  const text = typeof body.text === 'string' ? body.text.trim() : ''
  const voiceRaw = typeof body.voice === 'string' ? body.voice : 'alloy'
  const instructions = typeof body.instructions === 'string' ? body.instructions.slice(0, 2000) : ''

  if (!text) {
    return NextResponse.json({ ok: false, reason: 'EMPTY_TEXT' }, { status: 400 })
  }
  // 1 回のクリップは長くて数百字を想定。暴発防止で 2000 字で止める。
  if (text.length > 2000) {
    return NextResponse.json({ ok: false, reason: 'TEXT_TOO_LONG' }, { status: 400 })
  }
  if (!ALLOWED_VOICES.includes(voiceRaw as Voice)) {
    return NextResponse.json({ ok: false, reason: 'BAD_VOICE' }, { status: 400 })
  }
  const voice = voiceRaw as Voice

  // 予算ゲート
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  try {
    const { data, error } = await supabase.rpc('bump_tts_counter', {
      p_date: currentPeriodDateJst(),
      p_kind: 'narration',
      p_limit: NARRATION_DAILY_LIMIT,
    })
    if (error) {
      console.error('narration bump_tts_counter failed:', error.message)
      // DB 失敗時は OpenAI 側も失敗する想定で保守的に続行
    } else if (typeof data === 'number' && data < 0) {
      return NextResponse.json(
        { ok: false, reason: 'DAILY_BUDGET_EXCEEDED', limit: NARRATION_DAILY_LIMIT },
        { status: 429 },
      )
    }
  } catch (e) {
    console.error('narration budget check threw:', e)
  }

  // OpenAI TTS 呼び出し
  let res: Response
  try {
    res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts',
        voice,
        input: text,
        instructions: instructions || undefined,
        response_format: 'mp3',
      }),
    })
  } catch (e) {
    console.error('openai fetch threw:', e)
    return NextResponse.json({ ok: false, reason: 'OPENAI_FETCH_FAILED' }, { status: 502 })
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    console.error('openai tts error', res.status, errText.slice(0, 300))
    return NextResponse.json(
      { ok: false, reason: 'OPENAI_ERROR', status: res.status, detail: errText.slice(0, 300) },
      { status: 502 },
    )
  }

  const arrayBuf = await res.arrayBuffer()
  const buf = Buffer.from(arrayBuf)
  return NextResponse.json({
    ok: true,
    audioBase64: buf.toString('base64'),
    mime: 'audio/mpeg',
    bytes: buf.byteLength,
  })
}
