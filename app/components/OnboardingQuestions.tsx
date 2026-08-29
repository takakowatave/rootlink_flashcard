'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { HiOutlineArrowLeft } from 'react-icons/hi2'
import { MdAddCircle } from 'react-icons/md'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabaseClient'
import { isNativePlatform } from '@/lib/isNativePlatform'
import Button from './Button'

// Figma: xe5UwVx38JWu5doqwXczQu
//   Web  : 2613:6938 (4画面: Level → Source → Expectation → Complete)
//   Native: 上記 + 2609:6594 (学習時間帯) を Expectation の後に挿入 (5画面)
// Splash と 利用規約 は /onboarding (ネイティブのみ) に分離。
// リマインダーは OS のローカル通知のみ (DB 永続化なし)。追加ボタンは OS 通知設定を開く。

export type EnglishLevel = 'a1_a2' | 'b1' | 'b2' | 'c1' | 'c2'
export type AcquisitionSource = 'search' | 'appstore' | 'sns' | 'blog' | 'wom' | 'other'
export type Expectation = 'dictionary' | 'exam' | 'mining' | 'etymology' | 'other'

export type ReminderSlot = {
  key: 'morning' | 'lunch' | 'night'
  label: string
  time: string // "HH:MM"
  enabled: boolean
}

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

const DEFAULT_REMINDERS: ReminderSlot[] = [
  { key: 'morning', label: '起床時', time: '07:00', enabled: true },
  { key: 'lunch', label: 'お昼休み', time: '12:00', enabled: false },
  { key: 'night', label: '寝る前', time: '20:00', enabled: false },
]

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
  onReminderChange: (key: ReminderSlot['key'], patch: Partial<ReminderSlot>) => void
  onOpenNotificationSettings: () => void
  onNext: () => void
  onBack: () => void
  onSubmit: () => void
}

function ProgressHeader({
  step,
  totalSteps,
  onBack,
}: {
  step: Step
  totalSteps: number
  onBack: () => void
}) {
  const pct = (step / totalSteps) * 100
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
          {step} / {totalSteps}
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

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[31px] w-[51px] rounded-full transition-colors shrink-0 ${
        checked ? 'bg-primary' : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 size-[27px] rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[20px]' : 'translate-x-0'
        }`}
      />
    </button>
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
  onOpenNotificationSettings,
  onNext,
  onBack,
  onSubmit,
}: ViewProps) {
  const canProceedLevel = level !== null
  const canProceedSource = source !== null
  const canProceedExpectation = expectation !== null
  const completeStep = showReminders ? 5 : 4

  return (
    <div className="fixed inset-0 z-[110] flex items-stretch justify-center md:items-center md:p-6">
      <div className="absolute inset-0 bg-black/40 hidden md:block" />
      <div className="relative z-10 flex flex-col w-full h-full md:h-auto md:max-w-[720px] md:max-h-[85dvh] bg-teal-50 md:rounded-2xl md:shadow-xl overflow-hidden">
      <ProgressHeader step={step} totalSteps={totalSteps} onBack={onBack} />

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
                  {reminders.map((slot) => (
                    <div key={slot.key} className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-1.5">
                        <label className="inline-flex items-center rounded-md border border-slate-400 px-2.5 py-1 cursor-pointer">
                          <input
                            type="time"
                            value={slot.time}
                            onChange={(e) => onReminderChange(slot.key, { time: e.target.value })}
                            className="bg-transparent text-[15px] font-medium text-gray-950 tabular-nums outline-none w-[58px]"
                          />
                        </label>
                        <span className="text-base text-gray-950">{slot.label}</span>
                      </div>
                      <Toggle
                        checked={slot.enabled}
                        onChange={(next) => onReminderChange(slot.key, { enabled: next })}
                        label={`${slot.label} の通知`}
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={onOpenNotificationSettings}
                  className="mt-6 w-full h-10 flex items-center justify-center gap-1 border border-primary rounded-full text-sm font-medium text-primary"
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
          <Button onClick={onNext} disabled={!canProceedLevel} variant="primary" fullWidth radius="full" className="h-[50px] text-base font-medium">
            次へ
          </Button>
        )}
        {step === 2 && (
          <Button onClick={onNext} disabled={!canProceedSource} variant="primary" fullWidth radius="full" className="h-[50px] text-base font-medium">
            次へ
          </Button>
        )}
        {step === 3 && (
          <Button onClick={onNext} disabled={!canProceedExpectation} variant="primary" fullWidth radius="full" className="h-[50px] text-base font-medium">
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

async function scheduleReminders(reminders: ReminderSlot[]): Promise<void> {
  try {
    const mod = await import('@capacitor/local-notifications')
    const perm = await mod.LocalNotifications.requestPermissions()
    if (perm.display !== 'granted') return
    const pending = await mod.LocalNotifications.getPending()
    if (pending.notifications.length > 0) {
      await mod.LocalNotifications.cancel({ notifications: pending.notifications })
    }
    const enabled = reminders.filter((r) => r.enabled)
    if (enabled.length === 0) return
    const notifications = enabled.map((r, i) => {
      const [h, m] = r.time.split(':').map(Number)
      const at = new Date()
      at.setHours(h ?? 0, m ?? 0, 0, 0)
      if (at.getTime() <= Date.now()) at.setDate(at.getDate() + 1)
      return {
        id: i + 1,
        title: 'RootLink',
        body: '今日の1語を思い出そう',
        schedule: { at, repeats: true, every: 'day' as const },
      }
    })
    await mod.LocalNotifications.schedule({ notifications })
  } catch {
    // capacitor plugin unavailable (web preview) — silently skip
  }
}

async function openNotificationSettings(): Promise<void> {
  try {
    const { NativeSettings, IOSSettings, AndroidSettings } = await import('capacitor-native-settings')
    await NativeSettings.open({
      optionIOS: IOSSettings.App,
      optionAndroid: AndroidSettings.AppNotification,
    })
  } catch {
    // plugin unavailable in web preview — silently skip
  }
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

  const showReminders = useMemo(() => isNativePlatform(), [])
  const totalSteps = showReminders ? 5 : 4

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

  const goNext = () => setStep((s) => (s < totalSteps ? ((s + 1) as Step) : s))
  const goBack = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))

  const patchReminder = (key: ReminderSlot['key'], patch: Partial<ReminderSlot>) => {
    setReminders((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
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
    if (showReminders) await scheduleReminders(reminders)
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
      onOpenNotificationSettings={openNotificationSettings}
      onNext={goNext}
      onBack={goBack}
      onSubmit={submit}
    />
  )
}
