'use client'

import Link from "next/link";
import Button from "@/components/Button";
import AuthPage from "@/components/auth/AuthPage";
import AuthCard from "@/components/auth/AuthCard";
import { useLocale } from "@/lib/LocaleProvider";

const COPY = {
  ja: {
    title: '退会が完了しました',
    thanks: 'RootLink をご利用いただきありがとうございました。',
    emailNotice: '登録メールアドレス宛に、退会完了のご連絡をお送りしています。',
    toHome: 'トップへ戻る',
  },
  en: {
    title: 'Your account has been deleted',
    thanks: 'Thank you for using RootLink.',
    emailNotice: 'A deletion confirmation has been sent to your registered email address.',
    toHome: 'Back to home',
  },
} as const

export default function GoodbyePage() {
  const locale = useLocale()
  const t = COPY[locale]
  return (
    <AuthPage>
      <AuthCard title={t.title}>
        <div className="flex flex-col gap-4 py-2 text-center">
          <p className="text-sm text-gray-900 leading-relaxed">{t.thanks}</p>
          <p className="text-xs text-gray-500 leading-relaxed">{t.emailNotice}</p>
          <Link href="/" className="mt-2">
            <Button type="button" variant="primary" size="md" radius="lg" fullWidth>
              {t.toHome}
            </Button>
          </Link>
        </div>
      </AuthCard>
    </AuthPage>
  );
}
