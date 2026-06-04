export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-gray-700">
      <h1 className="text-2xl font-bold mb-2">利用規約</h1>
      <p className="text-sm text-gray-400 mb-10">制定日：2026年6月　最終更新：2026年6月</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">1. 事業者情報</h2>
        <p>運営者：RootLink<br />お問い合わせ：<a href="mailto:rootlink.japan@gmail.com" className="text-green-600 underline">rootlink.japan@gmail.com</a></p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">2. サービス概要</h2>
        <p className="text-sm">RootLink（以下「本サービス」）は、語源をベースにした英語ボキャブラリー学習アプリです。無料プランおよびプレミアムプランを提供しています。</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">3. アカウント</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>本サービスの利用には、メールアドレスによるアカウント登録が必要です。</li>
          <li>アカウント情報の管理はユーザー自身の責任で行ってください。</li>
          <li>不正利用が確認された場合、事前通知なくアカウントを停止することがあります。</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">4. 料金・決済</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>プレミアムプランの料金は、月額 ¥500（税込）または年額 ¥4,800（税込）です。</li>
          <li>決済はStripeを通じて処理されます。カード情報は当方では保持しません。</li>
          <li>月額プランは毎月、年額プランは毎年、自動で更新されます。</li>
          <li>プランのキャンセルはいつでも可能です。キャンセル後も契約期間終了まで引き続きご利用いただけます。</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">5. 返金ポリシー</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><strong>月額プラン：</strong>購入日から7日以内にお申し出いただいた場合、全額返金いたします。</li>
          <li><strong>年額プラン：</strong>購入日から14日以内にお申し出いただいた場合、全額返金いたします。</li>
          <li>上記期間を過ぎた場合は、原則として返金はいたしません。</li>
          <li>返金をご希望の場合は <a href="mailto:rootlink.japan@gmail.com" className="text-green-600 underline">rootlink.japan@gmail.com</a> までご連絡ください。</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">6. 禁止事項</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>本サービスのコンテンツの無断転載・複製・販売</li>
          <li>サービスへの不正アクセス・リバースエンジニアリング</li>
          <li>他のユーザーへの迷惑行為</li>
          <li>その他、法令または公序良俗に反する行為</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">7. 免責事項</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>本サービスは現状有姿で提供されます。学習効果を保証するものではありません。</li>
          <li>システム障害・メンテナンス等によるサービス停止について、当方は責任を負いません。</li>
          <li>辞書データ・語源情報の正確性について、完全性を保証するものではありません。</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">8. サービスの変更・終了</h2>
        <p className="text-sm">当方は事前通知のうえ、本サービスの内容変更または終了を行うことができます。サービス終了の場合、残存する有料期間分は返金いたします。</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">9. 準拠法・管轄</h2>
        <p className="text-sm">本規約は日本法に準拠します。紛争が生じた場合は、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">10. 規約の変更</h2>
        <p className="text-sm">本規約は必要に応じて変更することがあります。重要な変更の場合はサービス内でお知らせします。変更後も継続して本サービスをご利用いただいた場合、変更後の規約に同意したものとみなします。</p>
      </section>
    </div>
  )
}
