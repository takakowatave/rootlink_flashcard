'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { HiOutlineArrowLeft } from 'react-icons/hi2'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabaseClient'
import Button from './Button'

// Figma: xe5UwVx38JWu5doqwXczQu / 2613:6938 (onboarding)
// Web は 3画面フルスクリーン: Level → Source → Complete
// Splash + 利用規約 + 学習時間帯(通知) はネイティブアプリのみ (Web は対象外)

export type EnglishLevel = 'a1_a2' | 'b1' | 'b2' | 'c1' | 'c2'
export type AcquisitionSource = 'search' | 'appstore' | 'sns' | 'blog' | 'wom' | 'other'

export const ONBOARDING_COMPLETE_EVENT = 'rootlink-onboarding-completed'

const TOTAL_STEPS = 3

type LevelOption = { value: EnglishLevel; label: string; detail: string }
type SourceOption = { value: AcquisitionSource; label: string }

const LEVEL_OPTIONS: LevelOption[] = [
  { value: 'a1_a2', label: '挨拶と自己紹介ができる', detail: '英検〜2級 / TOEIC 〜600' },
  { value: 'b1', label: '身近な話題を話せる', detail: '英検準1級 / TOEIC 600〜780 / IELTS 4.0〜5.0 / TOEFL 42〜71' },
  { value: 'b2', label: '日常会話は続けられる', detail: 'TOEIC 785〜940 / IELTS 5.5〜6.5 / TOEFL 72〜94' },
  { value: 'c1', label: '抽象的な議論もできる', detail: '英検1級 / TOEIC 945〜 / IELTS 7.0〜8.0 / TOEFL 95〜' },
  { value: 'c2', label: 'ネイティブと遜色なく話せる', detail: 'IELTS 8.5〜9.0 / CEFR C2' },
]

const SOURCE_OPTIONS: SourceOption[] = [
  { value: 'search', label: 'インターネット検索' },
  { value: 'appstore', label: 'アプリストア' },
  { value: 'sns', label: 'SNS' },
  { value: 'blog', label: '記事・ブログ' },
  { value: 'wom', label: '口コミ' },
  { value: 'other', label: 'その他' },
]

type Step = 1 | 2 | 3

type ViewProps = {
  step: Step
  level: EnglishLevel | null
  source: AcquisitionSource | null
  saving?: boolean
  onLevelChange: (v: EnglishLevel) => void
  onSourceChange: (v: AcquisitionSource) => void
  onNext: () => void
  onBack: () => void
  onSubmit: () => void
}

function ProgressHeader({ step, onBack }: { step: Step; onBack: () => void }) {
  const pct = (step / TOTAL_STEPS) * 100
  const canBack = step > 1
  return (
    <div className="flex items-center gap-3 h-14 px-2 border-b border-line">
      <button
        type="button"
        onClick={onBack}
        disabled={!canBack}
        aria-label="戻る"
        className="size-6 flex items-center justify-center disabled:opacity-30"
      >
        <HiOutlineArrowLeft className="size-5 text-gray-700" />
      </button>
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-sm text-gray-400 tabular-nums whitespace-nowrap">
          {step} / {TOTAL_STEPS}
        </span>
      </div>
    </div>
  )
}

function Radio({ selected }: { selected: boolean }) {
  return (
    <span
      className={`size-4 rounded-full border flex items-center justify-center shrink-0 ${
        selected ? 'border-primary' : 'border-slate-400 bg-white'
      }`}
    >
      {selected && <span className="size-2 rounded-full bg-primary" />}
    </span>
  )
}

export function OnboardingQuestionsView({
  step,
  level,
  source,
  saving = false,
  onLevelChange,
  onSourceChange,
  onNext,
  onBack,
  onSubmit,
}: ViewProps) {
  const canProceedLevel = level !== null
  const canProceedSource = source !== null

  return (
    <div className="fixed inset-0 z-[110] bg-teal-50 flex flex-col">
      <ProgressHeader step={step} onBack={onBack} />

      <div className="flex-1 overflow-y-auto pb-32">
        {step === 1 && (
          <div className="flex flex-col gap-6 pt-6">
            <h2 className="text-xl font-semibold text-center leading-7 text-gray-950">
              現在の英語レベルを<br />教えてください
            </h2>
            <div className="flex flex-col gap-2 px-4">
              {LEVEL_OPTIONS.map((opt) => {
                const selected = level === opt.value
                return (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 bg-white border-2 rounded-md py-4 pl-4 pr-2 cursor-pointer transition-colors ${
                      selected ? 'border-primary' : 'border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="english_level"
                      value={opt.value}
                      checked={selected}
                      onChange={() => onLevelChange(opt.value)}
                      className="sr-only"
                    />
                    <Radio selected={selected} />
                    <span className="flex-1 flex flex-col gap-2">
                      <span className="text-base font-medium text-gray-950 leading-6">{opt.label}</span>
                      <span className="text-sm text-gray-400 leading-5">{opt.detail}</span>
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6 pt-6">
            <h2 className="text-xl font-semibold text-center leading-7 text-gray-950">
              RootLink を<br />何で知ったか教えてください
            </h2>
            <div className="flex flex-col gap-2 px-4">
              {SOURCE_OPTIONS.map((opt) => {
                const selected = source === opt.value
                return (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 h-16 bg-white border-2 rounded-md pl-4 pr-2 cursor-pointer transition-colors ${
                      selected ? 'border-primary' : 'border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="acquisition_source"
                      value={opt.value}
                      checked={selected}
                      onChange={() => onSourceChange(opt.value)}
                      className="sr-only"
                    />
                    <Radio selected={selected} />
                    <span className="text-base font-medium text-gray-950 leading-6">{opt.label}</span>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-6 pt-6">
            <h2 className="text-xl font-semibold text-center leading-7 text-gray-950">
              毎日ログインして<br />木を育てましょう
            </h2>
            <div className="px-4">
              <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 flex flex-col items-center gap-6">
                <Image src="/plant/lv4.png" alt="" width={240} height={240} priority />
                <p className="text-xl font-semibold text-center leading-7 text-gray-950">
                  ログイン日数で<br />レベルアップします
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 flex items-center justify-center px-6 bg-teal-50">
        {step === 1 && (
          <Button
            onClick={onNext}
            disabled={!canProceedLevel}
            variant="primary"
            fullWidth
            radius="full"
            className="h-[50px] text-base font-medium"
          >
            次へ
          </Button>
        )}
        {step === 2 && (
          <Button
            onClick={onNext}
            disabled={!canProceedSource}
            variant="primary"
            fullWidth
            radius="full"
            className="h-[50px] text-base font-medium"
          >
            次へ
          </Button>
        )}
        {step === 3 && (
          <Button
            onClick={onSubmit}
            disabled={saving}
            variant="primary"
            fullWidth
            radius="full"
            className="h-[50px] text-base font-medium"
          >
            {saving ? '保存中...' : 'はじめる'}
          </Button>
        )}
      </div>
    </div>
  )
}

export default function OnboardingQuestions() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState<Step>(1)
  const [level, setLevel] = useState<EnglishLevel | null>(null)
  const [source, setSource] = useState<AcquisitionSource | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    const check = async (uid: string | undefined) => {
      if (!uid) return
      const { data } = await supabase
        .from('profiles')
        .select('acquisition_source')
        .eq('id', uid)
        .single()
      if (cancelled) return
      if (!data || data.acquisition_source) return
      setUserId(uid)
      setVisible(true)
    }
    supabase.auth.getSession().then(({ data }) => check(data.session?.user?.id))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      check(session?.user?.id)
    })
    return () => { cancelled = true; sub.subscription.unsubscribe() }
  }, [])

  const goNext = () => setStep((s) => (s < TOTAL_STEPS ? ((s + 1) as Step) : s))
  const goBack = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))

  const submit = async () => {
    if (!userId || !level || !source) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        english_level: level,
        acquisition_source: source,
      })
      .eq('id', userId)
    setSaving(false)
    if (error) {
      console.error('ONBOARDING SAVE FAILED:', error)
      toast.error('保存に失敗しました')
      return
    }
    window.dispatchEvent(new CustomEvent(ONBOARDING_COMPLETE_EVENT))
    setVisible(false)
    router.push('/')
  }

  if (!visible) return null

  return (
    <OnboardingQuestionsView
      step={step}
      level={level}
      source={source}
      saving={saving}
      onLevelChange={setLevel}
      onSourceChange={setSource}
      onNext={goNext}
      onBack={goBack}
      onSubmit={submit}
    />
  )
}
