'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MdAddCircle } from 'react-icons/md'
import { HiOutlineTrash } from 'react-icons/hi2'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabaseClient'
import { isNativePlatform } from '@/lib/isNativePlatform'
import { isNativeOrPreview } from '@/lib/isPreviewNative'
import {
  canDeleteReminderSlot,
  DEFAULT_REMINDER_SLOTS,
  ensureReminderPermission,
  MAX_REMINDER_SLOTS,
  nextCustomSlotKey,
  nextCustomSlotTime,
  persistAndApplyReminders,
  type ReminderSlot as StoredReminderSlot,
} from '@/lib/reminders'
import { PROFILE_CREATED_EVENT } from './AppShell'
import Button from './Button'
import Toggle from './Toggle'
import PlantGrowthAnimation from './PlantGrowthAnimation'
import OnboardingProgressBar from './OnboardingProgressBar'
import {
  getNextOnboardingStepId,
  getOnboardingStepIndex,
  getOnboardingTotalSteps,
  getPreviousOnboardingStepId,
  QUESTION_STEPS,
  SPLASH_STEPS,
  type OnboardingStepId,
} from '@/lib/onboardingSteps'

// Figma: xe5UwVx38JWu5doqwXczQu
//   Web  : 2613:6938 (4画面: Level → Expectation → Source → Complete)
//   Native: 上記 + 2609:6594 (学習時間帯) を Source の後に挿入 (5画面)
// Welcome・利用規約・アカウント名は /onboarding/page.tsx で済ませている。
// 進捗バー・戻る・進むの通し番号は app/lib/onboardingSteps.ts に集約。

export type EnglishLevel = 'a1_a2' | 'b1' | 'b2' | 'c1' | 'c2'
export type AcquisitionSource = 'search' | 'appstore' | 'sns' | 'blog' | 'wom' | 'other'
export type Expectation = 'dictionary' | 'exam' | 'mining' | 'etymology' | 'other'

export type ReminderSlot = StoredReminderSlot

export const ONBOARDING_COMPLETE_EVENT = 'rootlink-onboarding-completed'

type LevelOption = { value: EnglishLevel; label: string; detail: string }
type SourceOption = { value: AcquisitionSource; label: string }
type ExpectationOption = { value: Expectation; label: string }

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

const EXPECTATION_OPTIONS: ExpectationOption[] = [
  { value: 'dictionary', label: '辞書として意味や語源をすぐ調べたい' },
  { value: 'exam', label: '試験対策の単語帳として使いたい' },
  { value: 'mining', label: '洋書や記事から拾った表現をためたい' },
  { value: 'etymology', label: '語源そのものを楽しみたい' },
  { value: 'other', label: 'その他' },
]

const DEFAULT_REMINDERS: ReminderSlot[] = DEFAULT_REMINDER_SLOTS

export type QuestionStepId = (typeof QUESTION_STEPS)[number]

type ViewProps = {
  stepId: QuestionStepId
  isNative: boolean
  level: EnglishLevel | null
  source: AcquisitionSource | null
  expectation: Expectation | null
  reminders: ReminderSlot[]
  saving?: boolean
  onLevelChange: (v: EnglishLevel) => void
  onSourceChange: (v: AcquisitionSource) => void
  onExpectationChange: (v: Expectation) => void
  onReminderChange: (
    key: ReminderSlot['key'],
    patch: Partial<ReminderSlot>,
  ) => void | Promise<void>
  onReminderAdd: () => void
  onReminderDelete: (key: ReminderSlot['key']) => void
  onNext: () => void
  onBack: () => void
  onSubmit: () => void
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
  stepId,
  isNative,
  level,
  source,
  expectation,
  reminders,
  saving = false,
  onLevelChange,
  onSourceChange,
  onExpectationChange,
  onReminderChange,
  onReminderAdd,
  onReminderDelete,
  onNext,
  onBack,
  onSubmit,
}: ViewProps) {
  const canProceedLevel = level !== null
  const canProceedSource = source !== null
  const canProceedExpectation = expectation !== null
  const totalSteps = getOnboardingTotalSteps(isNative)
  const progressStep = getOnboardingStepIndex(stepId, isNative)

  return (
    <div className="fixed inset-0 z-[110] flex items-stretch justify-center md:items-center md:p-6">
      <div className="absolute inset-0 bg-black/40 hidden md:block" />
      <div className="relative z-10 flex flex-col w-full h-full md:h-auto md:max-w-[720px] md:max-h-[85dvh] bg-teal-50 md:rounded-2xl md:shadow-xl overflow-hidden">
      <OnboardingProgressBar
        step={progressStep}
        totalSteps={totalSteps}
        onBack={onBack}
      />

      <div className="flex-1 overflow-y-auto pb-32">
        {stepId === 'englishLevel' && (
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

        {stepId === 'source' && (
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

        {stepId === 'expectation' && (
          <div className="flex flex-col gap-6 pt-6">
            <h2 className="text-xl font-semibold text-center leading-7 text-gray-950">
              RootLink に<br />何を期待していますか
            </h2>
            <div className="flex flex-col gap-2 px-4">
              {EXPECTATION_OPTIONS.map((opt) => {
                const selected = expectation === opt.value
                return (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 h-16 bg-white border-2 rounded-md pl-4 pr-2 cursor-pointer transition-colors ${
                      selected ? 'border-primary' : 'border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="expectation"
                      value={opt.value}
                      checked={selected}
                      onChange={() => onExpectationChange(opt.value)}
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

        {stepId === 'reminders' && (
          <div className="flex flex-col gap-6 pt-6">
            <h2 className="text-xl font-semibold text-center leading-7 text-gray-950">
              学習する時間帯を決めて<br />習慣化しましょう
            </h2>
            <div className="px-4">
              <div className="bg-white border-2 border-slate-200 rounded-3xl px-6 pb-6">
                <div className="divide-y divide-slate-200">
                  {reminders.map((slot) => {
                    const deletable = canDeleteReminderSlot(slot)
                    return (
                      <div key={slot.key} className="flex items-center justify-between py-4 gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <label className="inline-flex items-center rounded-md border border-slate-400 px-2.5 py-1 cursor-pointer">
                            <input
                              type="time"
                              value={slot.time}
                              onChange={(e) => onReminderChange(slot.key, { time: e.target.value })}
                              className="bg-transparent text-[15px] font-medium text-gray-950 tabular-nums outline-none"
                            />
                          </label>
                          {slot.label && (
                            <span className="text-base text-gray-950 truncate">{slot.label}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Toggle
                            checked={slot.enabled}
                            onChange={(next) => onReminderChange(slot.key, { enabled: next })}
                            label={`${slot.label || slot.time} の通知`}
                          />
                          {deletable && (
                            <button
                              type="button"
                              onClick={() => onReminderDelete(slot.key)}
                              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                              aria-label={`${slot.label || slot.time} を削除`}
                            >
                              <HiOutlineTrash className="size-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <button
                  type="button"
                  onClick={onReminderAdd}
                  disabled={reminders.length >= MAX_REMINDER_SLOTS}
                  className="mt-6 w-full h-10 flex items-center justify-center gap-1 border border-primary rounded-full text-sm font-medium text-primary disabled:border-slate-300 disabled:text-slate-300 disabled:cursor-not-allowed"
                >
                  追加
                  <MdAddCircle className="size-6" />
                </button>
              </div>
            </div>
          </div>
        )}

        {stepId === 'complete' && (
          <div className="flex flex-col gap-6 pt-6">
            <h2 className="text-xl font-semibold text-center leading-7 text-gray-950">
              毎日ログインして<br />木を育てましょう
            </h2>
            <div className="px-4">
              <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 flex flex-col items-center gap-6">
                <PlantGrowthAnimation />
                <p className="text-xl font-semibold text-center leading-7 text-gray-950">
                  ログイン日数で<br />レベルアップします
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 flex items-center justify-center px-6 bg-teal-50">
        {stepId === 'englishLevel' && (
          <Button onClick={onNext} disabled={!canProceedLevel} variant="primary" fullWidth radius="full" className="h-[50px] text-base font-medium">
            次へ
          </Button>
        )}
        {stepId === 'expectation' && (
          <Button onClick={onNext} disabled={!canProceedExpectation} variant="primary" fullWidth radius="full" className="h-[50px] text-base font-medium">
            次へ
          </Button>
        )}
        {stepId === 'source' && (
          <Button onClick={onNext} disabled={!canProceedSource} variant="primary" fullWidth radius="full" className="h-[50px] text-base font-medium">
            次へ
          </Button>
        )}
        {stepId === 'reminders' && (
          <Button onClick={onNext} variant="primary" fullWidth radius="full" className="h-[50px] text-base font-medium">
            次へ
          </Button>
        )}
        {stepId === 'complete' && (
          <Button onClick={onSubmit} disabled={saving} variant="primary" fullWidth radius="full" className="h-[50px] text-base font-medium">
            {saving ? '保存中...' : 'はじめる'}
          </Button>
        )}
      </div>
      </div>
    </div>
  )
}

export default function OnboardingQuestions() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const isNative = useMemo(() => isNativeOrPreview(isNativePlatform()), [])
  // 一覧の中で overlay が担当する範囲 (englishLevel 〜 complete) をフィルタして保持。
  const questionSteps = useMemo(
    () => QUESTION_STEPS.filter((id) => isNative || id !== 'reminders'),
    [isNative],
  )
  const [stepId, setStepId] = useState<QuestionStepId>('englishLevel')
  const [level, setLevel] = useState<EnglishLevel | null>(null)
  const [source, setSource] = useState<AcquisitionSource | null>(null)
  const [expectation, setExpectation] = useState<Expectation | null>(null)
  const [reminders, setReminders] = useState<ReminderSlot[]>(DEFAULT_REMINDERS)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    const check = async (uid: string | undefined) => {
      if (!uid) return
      const { data } = await supabase
        .from('profiles')
        .select('acquisition_source')
        .eq('id', uid)
        .maybeSingle()
      if (cancelled) return
      if (!data || data.acquisition_source) return
      setUserId(uid)
      setVisible(true)
    }
    supabase.auth.getSession().then(({ data }) => check(data.session?.user?.id))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      check(session?.user?.id)
    })
    const onProfileCreated = () => {
      supabase.auth.getSession().then(({ data }) => check(data.session?.user?.id))
    }
    window.addEventListener(PROFILE_CREATED_EVENT, onProfileCreated)
    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
      window.removeEventListener(PROFILE_CREATED_EVENT, onProfileCreated)
    }
  }, [])

  // 学習時間帯ステップでは、トグル ON / OFF も時刻の変更も
  // 許可ダイアログを出さずに自由に触れるようにする。実際の許可ダイアログは
  // reminders の「次へ」を押したタイミングで初めて出す。
  const goNext = async () => {
    if (stepId === 'reminders') {
      const hasAnyEnabled = reminders.some((r) => r.enabled)
      if (hasAnyEnabled) {
        await ensureReminderPermission()
        await persistAndApplyReminders({
          version: 1,
          masterEnabled: true,
          slots: reminders,
        })
      }
    }
    const next = getNextOnboardingStepId(stepId, isNative)
    if (next && (next === 'reminders' || QUESTION_STEPS.includes(next))) {
      setStepId(next as QuestionStepId)
    }
  }

  // englishLevel (overlay の先頭) の「←」は overlay を抜けてアカウント名
  // ステップ (page.tsx) に戻る。それ以外は一覧上の 1 つ前のステップに戻る。
  const goBack = () => {
    const prev = getPreviousOnboardingStepId(stepId, isNative)
    if (!prev) return
    if (SPLASH_STEPS.includes(prev)) {
      setVisible(false)
      router.push(`/onboarding?resume=${prev}`)
      return
    }
    setStepId(prev as QuestionStepId)
  }

  const patchReminder = (
    key: ReminderSlot['key'],
    patch: Partial<ReminderSlot>,
  ) => {
    const current = reminders.find((r) => r.key === key)
    if (!current) return
    const wantsOn = patch.enabled === true || patch.time !== undefined
    const nextEnabled = patch.enabled === false
      ? false
      : wantsOn
        ? true
        : current.enabled
    setReminders((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch, enabled: nextEnabled } : r)),
    )
  }

  const addReminderSlot = () => {
    setReminders((prev) => {
      if (prev.length >= MAX_REMINDER_SLOTS) return prev
      return [
        ...prev,
        {
          key: nextCustomSlotKey(),
          label: '',
          time: nextCustomSlotTime(prev),
          enabled: true,
        },
      ]
    })
  }

  const deleteReminderSlot = (key: ReminderSlot['key']) => {
    setReminders((prev) => {
      const target = prev.find((s) => s.key === key)
      if (!target || !canDeleteReminderSlot(target)) return prev
      return prev.filter((s) => s.key !== key)
    })
  }

  const submit = async () => {
    if (!userId || !level || !source || !expectation) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        english_level: level,
        acquisition_source: source,
        expectation,
      })
      .eq('id', userId)
    if (error) {
      setSaving(false)
      console.error('ONBOARDING SAVE FAILED:', error)
      toast.error('保存に失敗しました')
      return
    }
    setSaving(false)
    window.dispatchEvent(new CustomEvent(ONBOARDING_COMPLETE_EVENT))
    setVisible(false)
    router.push('/')
  }

  // 現在の stepId が overlay 側 (questionSteps) に属していなければ何もしない。
  // Native/Web の切替で中間ステップが外れたときの保険。
  useEffect(() => {
    if (!questionSteps.includes(stepId)) {
      setStepId('englishLevel')
    }
  }, [questionSteps, stepId])

  if (!visible) return null

  return (
    <OnboardingQuestionsView
      stepId={stepId}
      isNative={isNative}
      level={level}
      source={source}
      expectation={expectation}
      reminders={reminders}
      saving={saving}
      onLevelChange={setLevel}
      onSourceChange={setSource}
      onExpectationChange={setExpectation}
      onReminderChange={patchReminder}
      onReminderAdd={addReminderSlot}
      onReminderDelete={deleteReminderSlot}
      onNext={goNext}
      onBack={goBack}
      onSubmit={submit}
    />
  )
}
