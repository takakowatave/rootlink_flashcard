'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Button from './Button'

export type Expectation = 'dictionary' | 'exam' | 'mining' | 'etymology' | 'other'
export type EnglishLevel = 'a1_a2' | 'b1' | 'b2' | 'c1_plus'

export const ONBOARDING_COMPLETE_EVENT = 'rootlink-onboarding-completed'

type ExpectationOption = { value: Expectation; label: string; hint: string }
type LevelOption = { value: EnglishLevel; label: string }

const EXPECTATION_OPTIONS: ExpectationOption[] = [
  { value: 'dictionary', label: '辞書として使いたい', hint: '意味や語源をすぐ調べたい' },
  { value: 'exam', label: '試験対策の単語帳として使いたい', hint: 'TOEIC・英検など' },
  { value: 'mining', label: '洋書や記事から拾った表現をためたい', hint: '' },
  { value: 'etymology', label: '語源そのものを楽しみたい', hint: '' },
  { value: 'other', label: 'その他', hint: '自由記述' },
]

const LEVEL_OPTIONS: LevelOption[] = [
  { value: 'a1_a2', label: 'TOEIC 600未満 / 英検2級以下' },
  { value: 'b1', label: 'TOEIC 600〜730 / 英検準1級レベル' },
  { value: 'b2', label: 'TOEIC 730〜860' },
  { value: 'c1_plus', label: 'TOEIC 860以上 / 英検1級' },
]

const LANDING_BY_EXPECTATION: Record<Expectation, string> = {
  dictionary: '/',
  exam: '/decks',
  mining: '/',
  etymology: '/',
  other: '/',
}

type ViewProps = {
  screen: 1 | 2
  expectation: Expectation | null
  expectationOther: string
  level: EnglishLevel | null
  saving?: boolean
  onExpectationChange: (v: Expectation) => void
  onExpectationOtherChange: (v: string) => void
  onLevelChange: (v: EnglishLevel) => void
  onNext: () => void
  onBack: () => void
  onSubmit: () => void
}

export function OnboardingQuestionsView({
  screen,
  expectation,
  expectationOther,
  level,
  saving = false,
  onExpectationChange,
  onExpectationOtherChange,
  onLevelChange,
  onNext,
  onBack,
  onSubmit,
}: ViewProps) {
  const canProceedQ1 = expectation !== null && (expectation !== 'other' || expectationOther.trim().length > 0)
  const canSubmit = level !== null

  return (
    <div className="fixed inset-0 z-[110] bg-black/70 flex items-center justify-center px-4">
      <div className="relative bg-white rounded-2xl w-[min(420px,92vw)] max-h-[92vh] overflow-y-auto p-6 shadow-2xl">
        <div className="flex justify-center gap-1.5 mb-4">
          <span className={`block size-1.5 rounded-full ${screen === 1 ? 'bg-primary' : 'bg-gray-200'}`} />
          <span className={`block size-1.5 rounded-full ${screen === 2 ? 'bg-primary' : 'bg-gray-200'}`} />
        </div>

        {screen === 1 ? (
          <>
            <h2 className="text-base font-bold text-gray-900 mb-1">RootLink に何を期待していますか？</h2>
            <p className="text-xs text-gray-500 mb-4">一番近いものを選んでください</p>
            <div className="flex flex-col gap-2 mb-5">
              {EXPECTATION_OPTIONS.map((opt) => {
                const selected = expectation === opt.value
                return (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                      selected ? 'border-primary bg-primary-subtle' : 'border-line hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="expectation"
                      value={opt.value}
                      checked={selected}
                      onChange={() => onExpectationChange(opt.value)}
                      className="mt-1 accent-primary"
                    />
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-gray-900">{opt.label}</span>
                      {opt.hint && <span className="block text-xs text-gray-500 mt-0.5">{opt.hint}</span>}
                    </span>
                  </label>
                )
              })}
              {expectation === 'other' && (
                <textarea
                  value={expectationOther}
                  onChange={(e) => onExpectationOtherChange(e.target.value)}
                  placeholder="どんな用途か教えてください"
                  rows={3}
                  className="mt-1 w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-primary resize-none"
                />
              )}
            </div>
            <Button onClick={onNext} disabled={!canProceedQ1} variant="primary" size="lg" fullWidth>
              次へ
            </Button>
          </>
        ) : (
          <>
            <h2 className="text-base font-bold text-gray-900 mb-1">現在の英語レベルは？</h2>
            <p className="text-xs text-gray-500 mb-4">一番近いものを選んでください</p>
            <div className="flex flex-col gap-2 mb-5">
              {LEVEL_OPTIONS.map((opt) => {
                const selected = level === opt.value
                return (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                      selected ? 'border-primary bg-primary-subtle' : 'border-line hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="english_level"
                      value={opt.value}
                      checked={selected}
                      onChange={() => onLevelChange(opt.value)}
                      className="accent-primary"
                    />
                    <span className="text-sm font-medium text-gray-900">{opt.label}</span>
                  </label>
                )
              })}
            </div>
            <div className="flex gap-2">
              <Button onClick={onBack} variant="secondary" size="lg" fullWidth>
                戻る
              </Button>
              <Button onClick={onSubmit} disabled={!canSubmit || saving} variant="primary" size="lg" fullWidth>
                {saving ? '保存中...' : 'はじめる'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function OnboardingQuestions() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const [screen, setScreen] = useState<1 | 2>(1)
  const [expectation, setExpectation] = useState<Expectation | null>(null)
  const [expectationOther, setExpectationOther] = useState('')
  const [level, setLevel] = useState<EnglishLevel | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    const check = async (uid: string | undefined) => {
      if (!uid) return
      const { data } = await supabase
        .from('profiles')
        .select('expectation')
        .eq('id', uid)
        .single()
      if (cancelled) return
      if (!data || data.expectation) return
      setUserId(uid)
      setVisible(true)
    }
    supabase.auth.getSession().then(({ data }) => check(data.session?.user?.id))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      check(session?.user?.id)
    })
    return () => { cancelled = true; sub.subscription.unsubscribe() }
  }, [])

  const submit = async () => {
    if (!userId || !expectation || !level) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        expectation,
        expectation_other: expectation === 'other' ? expectationOther.trim() : null,
        english_level: level,
      })
      .eq('id', userId)
    setSaving(false)
    if (error) {
      console.error('ONBOARDING SAVE FAILED:', error)
      return
    }
    window.dispatchEvent(new CustomEvent(ONBOARDING_COMPLETE_EVENT, { detail: { expectation } }))
    setVisible(false)
    router.push(LANDING_BY_EXPECTATION[expectation])
  }

  if (!visible) return null

  return (
    <OnboardingQuestionsView
      screen={screen}
      expectation={expectation}
      expectationOther={expectationOther}
      level={level}
      saving={saving}
      onExpectationChange={setExpectation}
      onExpectationOtherChange={setExpectationOther}
      onLevelChange={setLevel}
      onNext={() => setScreen(2)}
      onBack={() => setScreen(1)}
      onSubmit={submit}
    />
  )
}
