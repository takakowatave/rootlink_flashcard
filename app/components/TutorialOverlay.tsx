'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { HiX } from 'react-icons/hi'
import { supabase } from '@/lib/supabaseClient'
import { ONBOARDING_COMPLETE_EVENT } from './OnboardingQuestions'
import { PROFILE_CREATED_EVENT } from './AppShell'

// チュートリアル完了フラグはDB（profiles.tutorial_completed）で管理。
// 途中ステップだけページ遷移をまたぐためユーザーIDごとに localStorage に保持する。
const STEP_PREFIX = 'rootlink_tutorial_step_'

// モジュールレベルで保持 → コンポーネントが再マウントされても状態が保持される
const _initializedUsers = new Set<string>()
const _completedUsers = new Set<string>()

async function markTutorialCompleted(uid: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ tutorial_completed: true })
    .eq('id', uid)
  if (error) console.error('TUTORIAL COMPLETE WRITE FAILED:', error)
}

type Step = {
  emoji: string
  title: string
  description: string
  // モーダルの中に「どこを見ればいいか」を文章で添える。図やハイライトは
  // 使わず、テキストで場所を伝える (旧: 対象要素の rect を追いかけて緑枠を
  // 出していたが、タブレットで位置ズレが解消しなかったため廃止)。
  where?: string
  requiredPath?: RegExp
  waitHint?: string
  autoSearch?: string
}

// selector によるハイライト枠と対象要素の位置計算は完全に廃止。
// 固定中央のモーダルと進む操作だけを残し、対象要素の位置は一切参照しない。
const STEPS: Step[] = [
  {
    emoji: '🌱',
    title: 'ようこそ RootLink へ！',
    description: '語源（ルーツ）から英単語を深く理解するアプリです。暗記に頼らず「なぜその意味なのか」を語根から学ぶことで、単語が自然と頭に定着します。',
  },
  {
    emoji: '🔍',
    title: '何か検索してみよう',
    description: '検索バーに英単語を入力してみましょう。語源・発音・意味・例文がまとめて表示されます。',
    where: '画面右下の丸い🔍ボタン (PC はヘッダーの検索バー) をタップ',
    autoSearch: 'component',
  },
  {
    emoji: '🌳',
    title: '語源パーツで意味を掴む',
    description: '単語を構成する語根・接頭辞・接尾辞をツリー形式で表示します。ここを押すと同じ語根を持つ単語の一覧も見られます。',
    where: '単語ページ上部の語源ブロックにある緑色のパーツをタップ',
    requiredPath: /^\/word\//,
  },
  {
    emoji: '📌',
    title: '多義語はピン止めで整理',
    description:
      '複数の意味がある単語は、覚えたい意味だけピン留めできます。ピン留めした意味だけがクイズと単語帳に表示されます。',
    where: '各意味の右上にある📌ピンのアイコンをタップして選ぶ',
    requiredPath: /^\/word\//,
  },
]

export default function TutorialOverlay() {
  const pathname = usePathname()
  const [authed, setAuthed] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [step, setStep] = useState<number | null>(null)
  const [visible, setVisible] = useState(false)
  const [waitMode, setWaitMode] = useState(false)

  useEffect(() => {
    let cancelled = false

    const init = async (uid: string | undefined) => {
      if (!uid) return
      if (_initializedUsers.has(uid) || _completedUsers.has(uid)) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('tutorial_completed, acquisition_source')
        .eq('id', uid)
        .maybeSingle()
      if (cancelled) return
      if (!profile) return
      if (profile.tutorial_completed) {
        _completedUsers.add(uid)
        return
      }
      if (!profile.acquisition_source) return

      _initializedUsers.add(uid)

      setUserId(uid)
      setStep(0)
      setAuthed(true)
    }

    supabase.auth.getSession().then(({ data }) => init(data.session?.user?.id))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      init(session?.user?.id)
    })

    const onOnboardingComplete = () => {
      supabase.auth.getSession().then(({ data }) => init(data.session?.user?.id))
    }
    const onProfileCreated = () => {
      supabase.auth.getSession().then(({ data }) => init(data.session?.user?.id))
    }
    window.addEventListener(ONBOARDING_COMPLETE_EVENT, onOnboardingComplete)
    window.addEventListener(PROFILE_CREATED_EVENT, onProfileCreated)

    return () => {
      cancelled = true
      subscription.unsubscribe()
      window.removeEventListener(ONBOARDING_COMPLETE_EVENT, onOnboardingComplete)
      window.removeEventListener(PROFILE_CREATED_EVENT, onProfileCreated)
    }
  }, [])

  useEffect(() => {
    if (!authed || step === null) return
    const current = STEPS[step]
    if (!current) return

    if (current.requiredPath && !current.requiredPath.test(pathname)) {
      setVisible(false)
      if (current.waitHint) {
        const timer = setTimeout(() => setWaitMode(true), 100)
        return () => clearTimeout(timer)
      }
      return
    }

    setWaitMode(false)
    const timer = setTimeout(() => setVisible(true), 300)
    return () => clearTimeout(timer)
  }, [authed, step, pathname])

  const advance = () => {
    const current = step !== null ? STEPS[step] : null
    const next = (step ?? 0) + 1

    if (current?.autoSearch) {
      window.dispatchEvent(
        new CustomEvent('tutorial-auto-search', { detail: { query: current.autoSearch } })
      )
    }

    if (next >= STEPS.length) {
      if (userId) {
        _completedUsers.add(userId)
        _initializedUsers.delete(userId)
        localStorage.removeItem(STEP_PREFIX + userId)
        void markTutorialCompleted(userId)
      }
      setVisible(false)
      setStep(null)
    } else {
      if (userId) localStorage.setItem(STEP_PREFIX + userId, String(next))
      setStep(next)
      setVisible(false)
    }
  }

  if (waitMode && step !== null && STEPS[step]?.waitHint) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto">
        <div className="bg-gray-900 text-white text-sm rounded-2xl px-5 py-3.5 shadow-xl flex items-center gap-3 max-w-[320px]">
          <span className="shrink-0 text-lg">{STEPS[step].emoji}</span>
          <p className="leading-snug">{STEPS[step].waitHint}</p>
          <button
            onClick={() => setWaitMode(false)}
            className="shrink-0 text-white/50 hover:text-white ml-1"
            aria-label="閉じる"
          >
            <HiX className="size-4" />
          </button>
        </div>
      </div>
    )
  }

  if (!visible || step === null) return null

  const current = STEPS[step]

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <div className="fixed inset-0 bg-black/70 pointer-events-auto" />

      <div
        className="fixed pointer-events-auto"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      >
        <div className="relative bg-white rounded-2xl w-[min(340px,90vw)] p-6 shadow-2xl">
          <button onClick={advance} className="absolute top-3 right-3 p-1 text-muted hover:text-gray-600 transition-colors" aria-label="閉じる">
            <HiX className="size-4" />
          </button>

          <div className="text-3xl text-center mb-3 select-none">{current.emoji}</div>
          <h2 className="text-base font-bold text-center text-gray-900 mb-2">{current.title}</h2>
          <p className="text-sm text-gray-600 text-center leading-relaxed mb-3">{current.description}</p>
          {current.where && (
            <p className="text-xs text-primary text-center leading-relaxed mb-5 px-2">
              {current.where}
            </p>
          )}

          <div className="flex justify-center gap-1.5 mb-4">
            {STEPS.map((_, i) => (
              <span key={i} className={`block size-1.5 rounded-full transition-colors ${i === step ? 'bg-primary' : 'bg-gray-200'}`} />
            ))}
          </div>

          <button
            onClick={advance}
            className="w-full bg-primary text-white rounded-full py-2.5 text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            {step === STEPS.length - 1 ? 'はじめる' : current.autoSearch ? 'component を検索する' : '次へ'}
          </button>
        </div>
      </div>
    </div>
  )
}
