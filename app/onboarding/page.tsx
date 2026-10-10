'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import toast from 'react-hot-toast'
import Button from '@/components/Button'
import { TextInput } from '@/components/TextInput'
import TermsContent from '@/components/TermsContent'
import { isNativePlatform } from '@/lib/isNativePlatform'
import { isNativeOrPreview } from '@/lib/isPreviewNative'
import { supabase } from '@/lib/supabaseClient'
import { PROFILE_CREATED_EVENT } from '@/components/AppShell'

// Figma 2613:6938 (native app) の 3 ステップ:
//   step 1  2609:6530  ウェルカム (ロゴ + ヒーロー)
//   step 2  2609:6552  利用規約 (スクロール本文 + 「同意してはじめる」で signInAnonymously)
//   step 3  3136:5694  アカウント名 (TextInput + 「次へ」で profiles.username 保存)
// その後 '/' に遷移し、AppShell 配下の OnboardingQuestions overlay が
// 英語レベル → 用途 → きっかけ → リマインダー → スタート の 5 ステップを続ける。

type Step = 1 | 2 | 3

const NAME_MAX = 20

export default function OnboardingPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [step, setStep] = useState<Step>(1)
  const [starting, setStarting] = useState(false)
  const [savingName, setSavingName] = useState(false)
  const [accountName, setAccountName] = useState('')

  useEffect(() => {
    if (!isNativeOrPreview(isNativePlatform())) {
      router.replace('/login')
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (cancelled) return
        if (session?.user) {
          // ゲストサインイン済みで戻ってきたらアカウント名ステップへ復帰
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', session.user.id)
            .maybeSingle()
          if (cancelled) return
          if (profile?.username) {
            router.replace('/')
            return
          }
          setStep(3)
          setReady(true)
          return
        }
        setReady(true)
      } finally {
        try {
          const mod = await import('@capacitor/splash-screen')
          await mod.SplashScreen.hide({ fadeOutDuration: 250 })
        } catch {
          // splash plugin unavailable in web preview; ignore
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  // step 2 の「同意してはじめる」= 匿名サインイン。成功したら step 3 (アカウント名) へ。
  async function handleAgree() {
    if (starting) return
    setStarting(true)
    try {
      if (!isNativePlatform()) {
        router.replace('/signup')
        return
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        const { error } = await supabase.auth.signInAnonymously()
        if (error) {
          toast.error('はじめるのに失敗しました。しばらくしてもう一度お試しください')
          return
        }
      }
      setStep(3)
    } catch {
      toast.error('はじめるのに失敗しました。しばらくしてもう一度お試しください')
    } finally {
      setStarting(false)
    }
  }

  // step 3 の「次へ」= profiles.username を保存して '/' へ。
  async function handleSaveName() {
    const trimmed = accountName.trim()
    if (!trimmed || savingName) return
    setSavingName(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('セッションが切れました。もう一度お試しください')
        setStep(1)
        return
      }
      const { error } = await supabase
        .from('profiles')
        .update({ username: trimmed })
        .eq('id', user.id)
      if (error) {
        toast.error('名前の保存に失敗しました')
        return
      }
      window.dispatchEvent(new CustomEvent(PROFILE_CREATED_EVENT))
      router.replace('/')
    } finally {
      setSavingName(false)
    }
  }

  if (!ready) return null

  return (
    <div className="fixed inset-0 bg-primary-subtle flex flex-col pt-[env(safe-area-inset-top)]">
      {step === 1 && <WelcomeStep onNext={() => setStep(2)} />}
      {step === 2 && (
        <TermsStep
          onBack={() => setStep(1)}
          onAgree={handleAgree}
          agreeing={starting}
        />
      )}
      {step === 3 && (
        <AccountNameStep
          value={accountName}
          onChange={setAccountName}
          onNext={handleSaveName}
          saving={savingName}
        />
      )}
    </div>
  )
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center gap-6 sm:gap-12 pt-6 pb-3 px-6">
        <div className="flex flex-col items-center gap-4 sm:gap-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="RootLink" className="h-[38px] sm:h-[68px] w-auto" />
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <div className="flex items-baseline gap-2 sm:gap-3">
              <span className="inline-flex items-center rounded-[10px] sm:rounded-[14px] bg-white border-t-2 border-l-2 border-r-[5px] border-b-[6px] sm:border-t-[3px] sm:border-l-[3px] sm:border-r-[7px] sm:border-b-[8px] border-solid border-[#ffb86a] px-2 sm:px-3 pt-1.5 pb-2.5 sm:pt-2 sm:pb-3 leading-none">
                <span className="text-[36px] sm:text-[54px] font-bold text-[#ff8904] leading-none">
                  語源
                </span>
              </span>
              <span className="text-[28px] sm:text-[42px] font-bold text-gray-950 leading-none">
                で覚える
              </span>
            </div>
            <p className="text-[26px] sm:text-[40px] font-bold text-gray-950 leading-none">
              英単語・辞書アプリ
            </p>
          </div>
        </div>

        <div className="relative w-[min(78vw,320px,40vh)] sm:w-[min(72vw,640px,52vh)] aspect-square">
          <Image
            src="/onboarding/splash-mock.png"
            alt=""
            fill
            priority
            sizes="(min-width: 640px) 520px, 78vw"
            className="object-contain"
          />
        </div>
      </div>

      <div
        className="w-full bg-white flex flex-col items-center gap-6 px-6 pt-8"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        <Button
          onClick={onNext}
          variant="primary"
          fullWidth
          radius="full"
          className="h-[50px] text-base font-medium"
        >
          次へ
        </Button>
      </div>
    </>
  )
}

function TermsStep({
  onBack,
  onAgree,
  agreeing,
}: {
  onBack: () => void
  onAgree: () => void
  agreeing: boolean
}) {
  return (
    <div className="flex flex-col flex-1 bg-slate-50 min-h-0">
      <div className="h-14 flex items-center border-b border-line px-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="戻る"
          className="p-2 rounded-full text-gray-700 hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <TermsContent />
      </div>
      <div
        className="w-full bg-white flex items-center px-6 pt-6"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        <Button
          onClick={onAgree}
          disabled={agreeing}
          variant="primary"
          fullWidth
          radius="full"
          className="h-[50px] text-base font-medium"
        >
          {agreeing ? 'はじめています...' : '同意してはじめる'}
        </Button>
      </div>
    </div>
  )
}

function AccountNameStep({
  value,
  onChange,
  onNext,
  saving,
}: {
  value: string
  onChange: (v: string) => void
  onNext: () => void
  saving: boolean
}) {
  const trimmed = value.trim()
  const canProceed = trimmed.length > 0 && trimmed.length <= NAME_MAX
  return (
    <div className="flex flex-col flex-1 bg-primary-subtle min-h-0">
      <div className="h-14 flex items-center border-b border-line px-2">
        <div className="w-10" />
        <div className="flex-1" />
      </div>
      <div className="flex-1 overflow-y-auto px-4 pt-6">
        <h2 className="text-xl font-semibold text-center text-gray-950">
          アカウント名を教えてください
        </h2>
        <div className="pt-6">
          <TextInput
            type="text"
            placeholder="ゲスト"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={NAME_MAX}
            autoFocus
          />
          <div className="flex justify-between text-sm text-gray-950 pt-1">
            <span>{NAME_MAX} 文字以内で設定してください</span>
            <span className="tabular-nums">{trimmed.length} / {NAME_MAX}</span>
          </div>
        </div>
      </div>
      <div
        className="w-full flex items-center px-6 pt-6"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        <Button
          onClick={onNext}
          disabled={!canProceed || saving}
          variant="primary"
          fullWidth
          radius="full"
          className="h-[50px] text-base font-medium"
        >
          {saving ? '保存中...' : '次へ'}
        </Button>
      </div>
    </div>
  )
}
