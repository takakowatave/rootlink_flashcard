'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/Button'
import { isNativePlatform } from '@/lib/isNativePlatform'

type Step = 'welcome' | 'notify'

export default function OnboardingPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [step, setStep] = useState<Step>('welcome')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isNativePlatform()) {
      router.replace('/login')
      return
    }
    setReady(true)
    ;(async () => {
      try {
        const mod = await import('@capacitor/splash-screen')
        await mod.SplashScreen.hide({ fadeOutDuration: 250 })
      } catch {
        // splash plugin unavailable in web preview; ignore
      }
    })()
  }, [router])

  const goSignup = () => router.replace('/signup')

  const requestNotification = async () => {
    setBusy(true)
    try {
      const mod = await import('@capacitor/local-notifications')
      const perm = await mod.LocalNotifications.requestPermissions()
      if (perm.display === 'granted') {
        const at = new Date()
        at.setHours(20, 0, 0, 0)
        if (at.getTime() <= Date.now()) at.setDate(at.getDate() + 1)
        await mod.LocalNotifications.schedule({
          notifications: [
            {
              id: 1,
              title: 'RootLink',
              body: '今日の1語を覚えよう',
              schedule: { at, repeats: true, every: 'day' },
            },
          ],
        })
      }
    } catch {
      // ignore — user can enable later from settings
    }
    setBusy(false)
    goSignup()
  }

  if (!ready) return null

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-white px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-sm">
        <div className="flex justify-center gap-1.5 mb-6">
          <span className={`block h-1.5 w-6 rounded-full ${step === 'welcome' ? 'bg-primary' : 'bg-gray-200'}`} />
          <span className={`block h-1.5 w-6 rounded-full ${step === 'notify' ? 'bg-primary' : 'bg-gray-200'}`} />
        </div>

        {step === 'welcome' ? (
          <div className="flex flex-col items-center text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="RootLink" className="h-6 w-auto mb-8" />
            <h1 className="text-2xl font-bold text-gray-900 mb-3">RootLink へようこそ</h1>
            <p className="text-sm text-gray-600 leading-relaxed mb-10">
              語源から英単語を理解する<br />
              語源オタクのための単語帳
            </p>
            <Button onClick={() => setStep('notify')} variant="primary" size="lg" radius="lg" fullWidth>
              つづける
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-primary-subtle text-primary text-3xl">
              🔔
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-3">毎日のリマインドを受け取る</h1>
            <p className="text-sm text-gray-600 leading-relaxed mb-10">
              毎日20時に1語を思い出す通知を送ります。<br />
              あとからいつでも変更できます。
            </p>
            <Button
              onClick={requestNotification}
              disabled={busy}
              variant="primary"
              size="lg"
              radius="lg"
              fullWidth
            >
              {busy ? '設定中...' : '通知を許可する'}
            </Button>
            <button
              type="button"
              onClick={goSignup}
              disabled={busy}
              className="mt-4 text-sm text-gray-500 underline disabled:opacity-40"
            >
              あとで
            </button>
          </div>
        )}

        <div className="mt-12 text-center text-xs text-gray-400">
          <Link href="/privacy" className="hover:text-gray-600">プライバシーポリシー</Link>
        </div>
      </div>
    </div>
  )
}
