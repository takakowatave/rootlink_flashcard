'use client'

import { useLocale } from '@/lib/LocaleProvider'
import type { DisplayLocale } from '@/types/DisplayLocale'

interface Props {
  locale?: DisplayLocale
}

type Copy = {
  title: string
  effectiveLine: string
  s1Title: string; operator: string; contactLabel: string
  s2Title: string; s2Lead: string; collect: string[]
  s3Title: string; purposes: string[]
  s4Title: string; s4Lead: string; serviceHeader: string; purposeHeader: string; services: Array<[string, string]>
  s5Title: string; s5Body: string
  s6Title: string; s6Intro: string; s6DeleteLead: string; deleteBullets: string[]
  s7Title: string; s7Lead: string; rights: string[]; s7Tail: string
  s8Title: string; s8Body: string
  s9Title: string; s9Body: string
  s10Title: string; s10Lead: string
}

const COPY: Record<DisplayLocale, Copy> = {
  ja: {
    title: 'プライバシーポリシー',
    effectiveLine: '制定日：2026年4月　最終更新：2026年9月',
    s1Title: '1. 事業者情報',
    operator: '運営者：RootLink',
    contactLabel: 'お問い合わせ：',
    s2Title: '2. 収集する情報',
    s2Lead: '当サービスでは、以下の情報を収集します。',
    collect: [
      'メールアドレス・表示名（アカウント登録時）',
      'Google / GitHubアカウント情報（ソーシャルログイン時）',
      '学習履歴・保存単語・学習成績などの利用データ',
      '検索キーワード（辞書データ生成のためOpenAI APIに送信されます）',
      'IPアドレス・ブラウザ情報・アクセスログ（自動収集）',
      '決済情報（Web版はStripe、アプリ版はApp Store / Google Playが管理します。カード番号等は当方では取得・保存しません）',
      '購入・サブスクリプションの状態（アプリ内課金の管理のためRevenueCatに送信されます）',
    ],
    s3Title: '3. 利用目的',
    purposes: [
      'サービスの提供・運営・改善',
      'ユーザー認証・アカウント管理',
      '学習データの保存・表示',
      '課金・決済処理',
      '不正利用の防止・セキュリティ対応',
      'メンテナンスや重要なお知らせの通知',
      'お問い合わせへの対応',
    ],
    s4Title: '4. 第三者への提供・委託先',
    s4Lead: '当サービスは以下の外部サービスを利用しています。各サービスのプライバシーポリシーに従い情報が処理されます。',
    serviceHeader: 'サービス',
    purposeHeader: '用途',
    services: [
      ['Supabase', '認証・データベース'],
      ['OpenAI', '辞書データ・翻訳生成'],
      ['Stripe', 'Web版の決済処理'],
      ['RevenueCat', 'アプリ内課金の管理・購入状態の同期'],
      ['Apple（App Store）', 'iOSアプリ内課金の決済処理'],
      ['Google（Google Play）', 'Androidアプリ内課金の決済処理'],
      ['Google', 'ソーシャルログイン'],
      ['GitHub', 'ソーシャルログイン'],
      ['Vercel', 'Webホスティング'],
      ['Google Cloud Run', 'APIサーバーホスティング'],
    ],
    s5Title: '5. Cookieについて',
    s5Body: '当サービスはログイン状態の維持のためにCookieを使用します。ブラウザの設定によりCookieを無効にすることができますが、その場合一部機能が利用できなくなる場合があります。',
    s6Title: '6. データの保存・管理',
    s6Intro: '収集したデータはSupabase（AWS東京リージョン）上で管理します。HTTPS通信による暗号化およびRow Level Securityによるアクセス制御を実施しています。',
    s6DeleteLead: '退会は、ログイン後の設定画面「アカウント削除」からいつでも行えます。退会時のデータの取り扱いは以下のとおりです。',
    deleteBullets: [
      'アカウント情報（メールアドレス・表示名・アイコン）、保存単語・保存フレーズ、学習成績・学習ストリーク等のすべての学習履歴は**退会と同時に削除**されます',
      'Premiumプランに加入中の場合、退会と同時にサブスクリプションを自動的に解約します',
      'バックアップおよびアクセスログに含まれる残存データは、**30日以内に完全に削除**します',
      'Stripe およびアプリ内課金（App Store / Google Play）上の決済履歴は、法令（税法等）に基づく保存義務のあいだ、各社のプライバシーポリシーに従って保管されます',
    ],
    s7Title: '7. ご本人の権利',
    s7Lead: 'ユーザーは保有個人データに関して以下の権利を有します。',
    rights: ['開示請求', '訂正・追加・削除', '利用停止・消去', '第三者提供の停止'],
    s7Tail: 'お問い合わせフォームまたは ',
    s8Title: '8. 未成年者の利用',
    s8Body: '当サービスは13歳以上を対象としています。13歳未満の方はご利用いただけません。',
    s9Title: '9. プライバシーポリシーの変更',
    s9Body: '本ポリシーは必要に応じて改定することがあります。重要な変更がある場合はサービス内にてお知らせします。変更後も継続してご利用いただいた場合、改定後のポリシーに同意したものとみなします。',
    s10Title: '10. お問い合わせ',
    s10Lead: '運営者：RootLink',
  },
  en: {
    title: 'Privacy Policy',
    effectiveLine: 'Effective: April 2026 · Last updated: September 2026',
    s1Title: '1. Operator',
    operator: 'Operator: RootLink',
    contactLabel: 'Contact: ',
    s2Title: '2. Information We Collect',
    s2Lead: 'We collect the following information:',
    collect: [
      'Email address and display name (when you create an account)',
      'Google / GitHub account information (when you use social login)',
      'Learning history, saved words, study results, and other usage data',
      'Search queries (sent to the OpenAI API to generate dictionary data)',
      'IP address, browser information, and access logs (collected automatically)',
      'Payment information (Stripe for the web, App Store / Google Play for the apps — we never receive or store your card number)',
      'Purchase and subscription status (sent to RevenueCat to manage in-app purchases)',
    ],
    s3Title: '3. How We Use Your Information',
    purposes: [
      'Providing, operating, and improving the service',
      'User authentication and account management',
      'Storing and displaying your learning data',
      'Billing and payment processing',
      'Preventing abuse and keeping the service secure',
      'Sending maintenance notices and other important announcements',
      'Responding to inquiries',
    ],
    s4Title: '4. Third-Party Services',
    s4Lead: "We use the following third-party services. Information is handled under each service's own privacy policy.",
    serviceHeader: 'Service',
    purposeHeader: 'Purpose',
    services: [
      ['Supabase', 'Authentication and database'],
      ['OpenAI', 'Dictionary data and translation generation'],
      ['Stripe', 'Payment processing (web)'],
      ['RevenueCat', 'In-app purchase management and subscription state'],
      ['Apple (App Store)', 'In-app purchase processing (iOS)'],
      ['Google (Google Play)', 'In-app purchase processing (Android)'],
      ['Google', 'Social login'],
      ['GitHub', 'Social login'],
      ['Vercel', 'Web hosting'],
      ['Google Cloud Run', 'API server hosting'],
    ],
    s5Title: '5. Cookies',
    s5Body: 'We use cookies to keep you signed in. You can disable cookies in your browser settings, but some features may stop working.',
    s6Title: '6. Data Storage and Management',
    s6Intro: 'Collected data is stored in Supabase (AWS Tokyo region). We encrypt data in transit via HTTPS and use Row Level Security to control access.',
    s6DeleteLead: 'You can delete your account at any time from Settings → "Delete account" after signing in. On deletion:',
    deleteBullets: [
      'Account data (email, display name, avatar), saved words and phrases, study results, streaks, and all other learning history are **deleted immediately**.',
      'Any active Premium subscription is cancelled at the same time.',
      'Residual data in backups and access logs is **fully erased within 30 days**.',
      "Payment records on Stripe and the app stores (App Store / Google Play) are retained under each provider's privacy policy and applicable tax law.",
    ],
    s7Title: '7. Your Rights',
    s7Lead: 'You have the following rights regarding the personal data we hold about you:',
    rights: [
      'Request disclosure',
      'Request correction, addition, or deletion',
      'Request suspension of use or erasure',
      'Request suspension of third-party disclosure',
    ],
    s7Tail: 'To exercise these rights, contact us via the inquiry form or at ',
    s8Title: '8. Minors',
    s8Body: 'This service is intended for users aged 13 or older. Users under 13 are not permitted.',
    s9Title: '9. Changes to This Policy',
    s9Body: 'We may revise this policy as needed. We will announce material changes within the service. Continued use after a revision constitutes acceptance of the revised policy.',
    s10Title: '10. Contact',
    s10Lead: 'Operator: RootLink',
  },
}

// locale prop を渡さなかったら LocaleProvider から取る。
function renderBoldMarkers(text: string) {
  // **x** を <strong>x</strong> に置き換える軽量パーサ
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

export default function PrivacyContent({ locale: localeProp }: Props) {
  const ctxLocale = useLocale()
  const locale = localeProp ?? ctxLocale
  const t = COPY[locale]
  const emailLabel = locale === 'ja' ? 'メール：' : 'Email: '

  return (
    <div className="text-gray-950 text-base leading-relaxed">
      <h1 className="text-2xl font-bold mb-2">{t.title}</h1>
      <p className="text-sm text-muted mb-10">{t.effectiveLine}</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">{t.s1Title}</h2>
        <p>{t.operator}<br />{t.contactLabel}<a href="mailto:rootlink.japan@gmail.com" className="text-green-600 underline">rootlink.japan@gmail.com</a></p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">{t.s2Title}</h2>
        <p className="mb-2">{t.s2Lead}</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          {t.collect.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">{t.s3Title}</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          {t.purposes.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">{t.s4Title}</h2>
        <p className="mb-3 text-sm">{t.s4Lead}</p>
        <div className="overflow-x-auto">
          <table className="text-sm w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-3 py-2 border border-line">{t.serviceHeader}</th>
                <th className="text-left px-3 py-2 border border-line">{t.purposeHeader}</th>
              </tr>
            </thead>
            <tbody>
              {t.services.map(([name, use]) => (
                <tr key={name}>
                  <td className="px-3 py-2 border border-line">{name}</td>
                  <td className="px-3 py-2 border border-line">{use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">{t.s5Title}</h2>
        <p className="text-sm">{t.s5Body}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">{t.s6Title}</h2>
        <p className="text-sm mb-3">{t.s6Intro}</p>
        <p className="text-sm mb-2">{t.s6DeleteLead}</p>
        <ul className="list-disc pl-5 space-y-1 text-sm mb-3">
          {t.deleteBullets.map((item, i) => <li key={i}>{renderBoldMarkers(item)}</li>)}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">{t.s7Title}</h2>
        <p className="mb-2 text-sm">{t.s7Lead}</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          {t.rights.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
        <p className="mt-2 text-sm">{t.s7Tail}<a href="mailto:rootlink.japan@gmail.com" className="text-green-600 underline">rootlink.japan@gmail.com</a>{locale === 'ja' ? ' までご連絡ください。' : '.'}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">{t.s8Title}</h2>
        <p className="text-sm">{t.s8Body}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">{t.s9Title}</h2>
        <p className="text-sm">{t.s9Body}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">{t.s10Title}</h2>
        <p className="text-sm">
          {t.s10Lead}<br />
          {emailLabel}<a href="mailto:rootlink.japan@gmail.com" className="text-green-600 underline">rootlink.japan@gmail.com</a>
        </p>
      </section>
    </div>
  )
}
