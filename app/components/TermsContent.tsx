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
  s2Title: string; s2Body: string
  s3Title: string; accountBullets: string[]
  s4Title: string; priceBullets: string[]
  s5Title: string; refundBullets: Array<{ bold: string; body: string }>; refundPolicy: string; refundContactLead: string
  s6Title: string; prohibited: string[]
  s7Title: string; disclaimers: string[]
  s8Title: string; s8Body: string
  s9Title: string; s9Body: string
  s10Title: string; s10Body: string
}

const COPY: Record<DisplayLocale, Copy> = {
  ja: {
    title: '利用規約',
    effectiveLine: '制定日：2026年6月　最終更新：2026年6月',
    s1Title: '1. 事業者情報',
    operator: '運営者：RootLink',
    contactLabel: 'お問い合わせ：',
    s2Title: '2. サービス概要',
    s2Body: 'RootLink（以下「本サービス」）は、語源をベースにした英語ボキャブラリー学習アプリです。無料プランおよびプレミアムプランを提供しています。',
    s3Title: '3. アカウント',
    accountBullets: [
      '本サービスの利用には、メールアドレスによるアカウント登録が必要です。',
      'アカウント情報の管理はユーザー自身の責任で行ってください。',
      '不正利用が確認された場合、事前通知なくアカウントを停止することがあります。',
    ],
    s4Title: '4. 料金・決済',
    priceBullets: [
      'プレミアムプランの料金は、月額 ¥500（税込）または年額 ¥4,800（税込）です。',
      '決済はStripeを通じて処理されます。カード情報は当方では保持しません。',
      '月額プランは毎月、年額プランは毎年、自動で更新されます。',
      'プランのキャンセルはいつでも可能です。キャンセル後も契約期間終了まで引き続きご利用いただけます。',
    ],
    s5Title: '5. 返金ポリシー',
    refundBullets: [
      { bold: '月額プラン：', body: '購入日から7日以内にお申し出いただいた場合、全額返金いたします。' },
      { bold: '年額プラン：', body: '購入日から14日以内にお申し出いただいた場合、全額返金いたします。' },
    ],
    refundPolicy: '上記期間を過ぎた場合は、原則として返金はいたしません。',
    refundContactLead: '返金をご希望の場合は ',
    s6Title: '6. 禁止事項',
    prohibited: [
      '本サービスのコンテンツの無断転載・複製・販売',
      'サービスへの不正アクセス・リバースエンジニアリング',
      '他のユーザーへの迷惑行為',
      'その他、法令または公序良俗に反する行為',
    ],
    s7Title: '7. 免責事項',
    disclaimers: [
      '本サービスは現状有姿で提供されます。学習効果を保証するものではありません。',
      'システム障害・メンテナンス等によるサービス停止について、当方は責任を負いません。',
      '辞書データ・語源情報の正確性について、完全性を保証するものではありません。',
    ],
    s8Title: '8. サービスの変更・終了',
    s8Body: '当方は事前通知のうえ、本サービスの内容変更または終了を行うことができます。サービス終了の場合、残存する有料期間分は返金いたします。',
    s9Title: '9. 準拠法・管轄',
    s9Body: '本規約は日本法に準拠します。紛争が生じた場合は、東京地方裁判所を第一審の専属的合意管轄裁判所とします。',
    s10Title: '10. 規約の変更',
    s10Body: '本規約は必要に応じて変更することがあります。重要な変更の場合はサービス内でお知らせします。変更後も継続して本サービスをご利用いただいた場合、変更後の規約に同意したものとみなします。',
  },
  en: {
    title: 'Terms of Service',
    effectiveLine: 'Effective: June 2026 · Last updated: June 2026',
    s1Title: '1. Operator',
    operator: 'Operator: RootLink',
    contactLabel: 'Contact: ',
    s2Title: '2. Service Overview',
    s2Body: 'RootLink ("the Service") is an English-vocabulary learning app built around word roots. It offers a free plan and a Premium plan.',
    s3Title: '3. Accounts',
    accountBullets: [
      'Using the Service requires an account registered with an email address.',
      'You are responsible for safeguarding your own account credentials.',
      'We may suspend an account without prior notice if abuse is detected.',
    ],
    s4Title: '4. Pricing and Billing',
    priceBullets: [
      'Premium costs ¥500 / month (tax included) or ¥4,800 / year (tax included). Local prices in your currency are shown at checkout.',
      'On the web, payments are processed by Stripe. We do not retain card information.',
      'Monthly plans renew every month; annual plans renew every year, automatically.',
      'You can cancel at any time. After cancellation, you keep access until the end of the current billing period.',
    ],
    s5Title: '5. Refund Policy',
    refundBullets: [
      { bold: 'Monthly plan: ', body: 'full refund if requested within 7 days of purchase.' },
      { bold: 'Annual plan: ', body: 'full refund if requested within 14 days of purchase.' },
    ],
    refundPolicy: 'After these windows, refunds are not provided as a rule.',
    refundContactLead: 'For refund requests, contact ',
    s6Title: '6. Prohibited Conduct',
    prohibited: [
      "Reusing, reproducing, or reselling the Service's content without permission",
      'Unauthorized access or reverse engineering of the Service',
      'Harassment of other users',
      'Any other conduct that violates applicable law or public order',
    ],
    s7Title: '7. Disclaimers',
    disclaimers: [
      'The Service is provided as-is. We make no guarantee of learning outcomes.',
      'We are not liable for service interruptions due to system failures, maintenance, or similar causes.',
      'We do not guarantee the completeness or accuracy of dictionary or etymology data.',
    ],
    s8Title: '8. Changes to and Termination of the Service',
    s8Body: 'We may change or discontinue the Service with prior notice. If the Service is discontinued, we will refund the remaining paid period.',
    s9Title: '9. Governing Law and Jurisdiction',
    s9Body: 'These Terms are governed by Japanese law. Any dispute will be submitted to the Tokyo District Court as the court of first instance with exclusive jurisdiction.',
    s10Title: '10. Changes to These Terms',
    s10Body: 'We may revise these Terms as needed. We will announce material changes within the Service. Continued use after a revision constitutes acceptance of the revised Terms.',
  },
}

export default function TermsContent({ locale: localeProp }: Props) {
  const ctxLocale = useLocale()
  const locale = localeProp ?? ctxLocale
  const t = COPY[locale]

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
        <p className="text-sm">{t.s2Body}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">{t.s3Title}</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          {t.accountBullets.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">{t.s4Title}</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          {t.priceBullets.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">{t.s5Title}</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          {t.refundBullets.map((item, i) => (
            <li key={i}><strong>{item.bold}</strong>{item.body}</li>
          ))}
          <li>{t.refundPolicy}</li>
          <li>{t.refundContactLead}<a href="mailto:rootlink.japan@gmail.com" className="text-green-600 underline">rootlink.japan@gmail.com</a>{locale === 'ja' ? ' までご連絡ください。' : '.'}</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">{t.s6Title}</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          {t.prohibited.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">{t.s7Title}</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          {t.disclaimers.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
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
        <p className="text-sm">{t.s10Body}</p>
      </section>
    </div>
  )
}
