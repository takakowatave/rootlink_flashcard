export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-gray-700">
      <h1 className="text-2xl font-bold mb-2">プライバシーポリシー</h1>
      <p className="text-sm text-gray-400 mb-10">制定日：2026年4月　最終更新：2026年4月</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">1. 事業者情報</h2>
        <p>運営者：RootLink<br />お問い合わせ：<a href="mailto:rootlink.japan@gmail.com" className="text-green-600 underline">rootlink.japan@gmail.com</a></p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">2. 収集する情報</h2>
        <p className="mb-2">当サービスでは、以下の情報を収集します。</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>メールアドレス・表示名（アカウント登録時）</li>
          <li>Google / GitHubアカウント情報（ソーシャルログイン時）</li>
          <li>学習履歴・保存単語・クイズ結果などの利用データ</li>
          <li>検索キーワード（辞書データ生成のためOpenAI APIに送信されます）</li>
          <li>IPアドレス・ブラウザ情報・アクセスログ（自動収集）</li>
          <li>決済情報（Stripeが管理します。カード番号等は当方では取得・保存しません）</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">3. 利用目的</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>サービスの提供・運営・改善</li>
          <li>ユーザー認証・アカウント管理</li>
          <li>学習データの保存・表示</li>
          <li>課金・決済処理</li>
          <li>不正利用の防止・セキュリティ対応</li>
          <li>メンテナンスや重要なお知らせの通知</li>
          <li>お問い合わせへの対応</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">4. 第三者への提供・委託先</h2>
        <p className="mb-3 text-sm">当サービスは以下の外部サービスを利用しています。各サービスのプライバシーポリシーに従い情報が処理されます。</p>
        <div className="overflow-x-auto">
          <table className="text-sm w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-3 py-2 border border-gray-200">サービス</th>
                <th className="text-left px-3 py-2 border border-gray-200">用途</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Supabase', '認証・データベース'],
                ['OpenAI', '辞書データ・翻訳生成'],
                ['Stripe', '決済処理'],
                ['Google', 'ソーシャルログイン'],
                ['GitHub', 'ソーシャルログイン'],
                ['Vercel', 'Webホスティング'],
                ['Google Cloud Run', 'APIサーバーホスティング'],
              ].map(([name, use]) => (
                <tr key={name}>
                  <td className="px-3 py-2 border border-gray-200">{name}</td>
                  <td className="px-3 py-2 border border-gray-200">{use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">5. Cookieについて</h2>
        <p className="text-sm">当サービスはログイン状態の維持のためにCookieを使用します。ブラウザの設定によりCookieを無効にすることができますが、その場合一部機能が利用できなくなる場合があります。</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">6. データの保存・管理</h2>
        <p className="text-sm">収集したデータはSupabase（AWS東京リージョン）上で管理します。アカウント退会後30日以内に個人データを削除します。HTTPS通信による暗号化およびRow Level Securityによるアクセス制御を実施しています。</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">7. ご本人の権利</h2>
        <p className="mb-2 text-sm">ユーザーは保有個人データに関して以下の権利を有します。</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>開示請求</li>
          <li>訂正・追加・削除</li>
          <li>利用停止・消去</li>
          <li>第三者提供の停止</li>
        </ul>
        <p className="mt-2 text-sm">お問い合わせフォームまたは <a href="mailto:rootlink.japan@gmail.com" className="text-green-600 underline">rootlink.japan@gmail.com</a> までご連絡ください。</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">8. 未成年者の利用</h2>
        <p className="text-sm">当サービスは13歳以上を対象としています。13歳未満の方はご利用いただけません。</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">9. プライバシーポリシーの変更</h2>
        <p className="text-sm">本ポリシーは必要に応じて改定することがあります。重要な変更がある場合はサービス内にてお知らせします。変更後も継続してご利用いただいた場合、改定後のポリシーに同意したものとみなします。</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">10. お問い合わせ</h2>
        <p className="text-sm">
          運営者：RootLink<br />
          メール：<a href="mailto:rootlink.japan@gmail.com" className="text-green-600 underline">rootlink.japan@gmail.com</a>
        </p>
      </section>
    </div>
  )
}
