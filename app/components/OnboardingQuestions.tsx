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
  ONBOARDING_STEP,
  ONBOARDING_TOTAL_STEPS,
} from '@/lib/onboardingSteps'

// Figma: xe5UwVx38JWu5doqwXczQu
//   Web  : 2613:6938 (4画面: Level → Source → Expectation → Complete)
//   Native: 上記 + 2609:6594 (学習時間帯) を Expectation の後に挿入 (5画面)
// Splash と 利用規約 は /onboarding (ネイティブのみ) に分離。
// リマインダーは OS のローカル通知のみ (DB 永続化なし)。追加ボタンは OS 通知設定を開く。

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

// Figma 2613:6938 (native app) に合わせた overlay の 5 ステップ:
//   step 1: 英語レベル / step 2: 用途 / step 3: きっかけ
//   step 4 (native): 学習時間帯 / step 5 or 4: スタート (完了)
// Welcome と利用規約とアカウント名は /onboarding/page.tsx で済ませている。
type Step = 1 | 2 | 3 | 4 | 5

type ViewProps = {
  step: Step
  totalSteps: number
  showReminders: boolean
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

// overlay 内の相対 step (1..5) をオンボーディング全体の通し番号 (4..8) にマップする。
// non-native (showReminders=false) のときは Reminders (通し 7) を飛ばして
// complete を 8 に揃える。
export function toGlobalOnboardingStep(step: Step, showReminders: boolean): number {
  if (showReminders) return step + 3
  if (step === 4) return ONBOARDING_STEP.complete
  return step + 3
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
  totalSteps,
  showReminders,
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
  // step 1=Level / 2=Expectation / 3=Source / 4=Reminders(native) / 5 or 4=Complete。
  const completeStep: Step = showReminders ? 5 : 4

  return (
    <div className="fixed inset-0 z-[110] flex items-stretch justify-center md:items-center md:p-6">
      <div className="absolute inset-0 bg-black/40 hidden md:block" />
      <div className="relative z-10 flex flex-col w-full h-full md:h-auto md:max-w-[720px] md:max-h-[85dvh] bg-teal-50 md:rounded-2xl md:shadow-xl overflow-hidden">
      <OnboardingProgressBar
        step={toGlobalOnboardingStep(step, showReminders)}
        totalSteps={ONBOARDING_TOTAL_STEPS}
        onBack={step > 1 ? onBack : null}
      />

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

        {step === 3 && (
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

        {step === 2 && (
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

        {step === 4 && showReminders && (
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

        {step === completeStep && (
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
        {step === 1 && (
          <Button onClick={onNext} disabled={!canProceedLevel} variant="primary" fullWidth radius="full" className="h-[50px] text-base font-medium">
            次へ
          </Button>
        )}
        {step === 2 && (
          <Button onClick={onNext} disabled={!canProceedExpectation} variant="primary" fullWidth radius="full" className="h-[50px] text-base font-medium">
            次へ
          </Button>
        )}
        {step === 3 && (
          <Button onClick={onNext} disabled={!canProceedSource} variant="primary" fullWidth radius="full" className="h-[50px] text-base font-medium">
            次へ
          </Button>
        )}
        {step === 4 && showReminders && (
          <Button onClick={onNext} variant="primary" fullWidth radius="full" className="h-[50px] text-base font-medium">
            次へ
          </Button>
        )}
        {step === completeStep && (
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
  const [step, setStep] = useState<Step>(1)
  const [level, setLevel] = useState<EnglishLevel | null>(null)
  const [source, setSource] = useState<AcquisitionSource | null>(null)
  const [expectation, setExpectation] = useState<Expectation | null>(null)
  const [reminders, setReminders] = useState<ReminderSlot[]>(DEFAULT_REMINDERS)
  const [saving, setSaving] = useState(false)

  // native の他、Web プレビューで ?preview=native が付いていれば学習時間帯
  // ステップ (step 4) を表示する。実 native では isNativePlatform() が
  // 生きるので今までどおり。本番 Web では false。
  const showReminders = useMemo(() => isNativeOrPreview(isNativePlatform()), [])
  const totalSteps = showReminders ? 5 : 4

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

  // 学習時間帯ステップ (step 4) では、トグル ON / OFF も時刻の変更も
  // 許可ダイアログを出さずに自由に触れるようにする。実際の許可ダイアログは
  // step 4 の「次へ」を押したタイミング (goNext) で初めて出す。
  const goNext = async () => {
    if (step === 4 && showReminders) {
      // ON にした枠が 1 つも無ければ、許可ダイアログを出さずそのまま次へ。
      const hasAnyEnabled = reminders.some((r) => r.enabled)
      if (hasAnyEnabled) {
        // 許可されたらこの後の persistAndApplyReminders が予約する。
        // 拒否されてもモーダルやエラーは出さず、設定は保存だけしてそのまま次へ進む
        // (後から設定画面で許可を戻したときに、その設定が引き継がれる)。
        await ensureReminderPermission()
        await persistAndApplyReminders({
          version: 1,
          masterEnabled: true,
          slots: reminders,
        })
      }
    }
    setStep((s) => (s < totalSteps ? ((s + 1) as Step) : s))
  }
  const goBack = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))

  const patchReminder = (
    key: ReminderSlot['key'],
    patch: Partial<ReminderSlot>,
  ) => {
    const current = reminders.find((r) => r.key === key)
    if (!current) return
    // 時刻を触ったら「この時刻に通知したい」という意思とみなして、その枠を ON にする
    // (以前は time だけ更新して OFF のままだと通知が予約されず、トグルが上がらない
    // バグになっていた)。許可ダイアログは step 5 の「次へ」でまとめて出すので、
    // ここでは state 更新だけ行う。
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
    // 通知の許可要求と予約は step 5 の「次へ」で完了済み。ここでは追加処理なし。
    setSaving(false)
    window.dispatchEvent(new CustomEvent(ONBOARDING_COMPLETE_EVENT))
    setVisible(false)
    router.push('/')
  }

  if (!visible) return null

  return (
    <OnboardingQuestionsView
      step={step}
      totalSteps={totalSteps}
      showReminders={showReminders}
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
