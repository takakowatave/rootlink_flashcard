# RootLink — プロジェクト共通コンテキスト

このファイルはChat・Code・Cowork問わず、全セッションで自動読み込みされる。
更新したら必ずコミットすること。

---

## サービス概要

**RootLink** は語源ベースの英語ボキャブラリー学習アプリ。

「なぜその意味なのか」を語源から理解させることで、暗記に頼らない定着を目指す。
英英辞書を使いたいレベルのユーザーを主なターゲットとし、日本語話者に限らずヨーロッパ圏などグローバルなユーザーも視野に入れている。

**一言で言うと：** 語源オタクが作った、語源オタクのための単語帳。

---

## ターゲットユーザー

- 英語中〜上級者（英英辞書を使いたいレベル）
- 語源・語根に興味がある人
- 日本語話者メイン、将来的にグローバル展開（EN/JA対応）
- 英語学習コミュニティ（TOEIC・英検・留学・ヨーロッパ圏）

---

## 現在の状態（2026年4月）

- URL: **https://www.rootlink.app**（本番稼働中）
- クローズドβ段階（URLを知っている人のみアクセス可能）
- 一人開発（オーナー: kiko）

---

## 技術スタック

### フロントエンド（このリポジトリ）
- **Next.js 14** App Router（Vercel デプロイ）
- **Supabase** — 認証・DB・Storage
- **Tailwind CSS**
- TypeScript strict

### バックエンド（別リポジトリ: `rootlink_server`）
- **Hono** on **Google Cloud Run**
- Oxford Dictionaries API — 辞書データ取得
- OpenAI API（gpt-4o-mini） — AI rewrite・語源パーツ抽出・日本語訳
- OpenAI TTS（gpt-4o-mini-tts） — 音声生成（イギリス英語）

### 主要テーブル（Supabase）
- `words` — 見出し語
- `dictionary_cache` — AI rewrite済み辞書ペイロード（`RewrittenPayload` 型）
- `saved_words` — ユーザーの保存単語（pinned_sense_id含む）
- `etymology_parts` / `etymology_part_glosses` — 語源パーツDB（first-write-wins）
- `quiz_results` — クイズ正誤記録

### 環境変数
APIキーは**Cloud Runの環境変数**に集約。Next.jsフロントエンドには置かない。
フロント側は `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_CLOUDRUN_API_URL` のみ。

---

## 実装済み機能

- 単語検索（Oxford + AI rewrite + キャッシュ）
- TTS音声（イギリス英語・オンデマンド生成・Supabase Storage）
- 語源フック・語源パーツ表示（AI抽出 → DB自動蓄積）
- 単語保存 + ピン留め（sense単位）
- Wordlist UI（コンパクトカード + モーダル詳細）
- クイズ機能（フラッシュカード・○/×・覚えた/まだ分岐・間違えた単語だけ再挑戦）
- quiz_results テーブル（正誤・日時記録）
- プライバシーポリシーページ
- サインアップ同意チェックボックス
- フッター（プライバシー・お問い合わせ）
- 独自ドメイン `rootlink.app`（2026年4月設定済み）

---

## ロードマップ

### ✅ 完了済み機能
- [x] wordlistのUI（コンパクトカード + モーダル）
- [x] TTS機能（イギリス英語・オンデマンド・Supabase Storage）
- [x] 単語検索（Oxford + AI rewrite + キャッシュ）
- [x] 語源フック（語源文AI抽出 → DB自動蓄積）
- [x] 日本語訳品質改善
- [x] 単語保存 + ピン留め永続化
- [x] クイズ機能（フラッシュカード・○/×自己採点・結果分岐）
- [x] quiz_resultsテーブル（正誤・日時を記録）
- [x] プライバシーポリシー・サインアップ同意・フッター
- [x] 独自ドメイン rootlink.app（2026年4月）
- [x] 型安全化（any型全廃・共有型整備）
- [x] CLAUDE.md・自動更新Hook設定

### 2026年4月
- [ ] LP作成（グローバル設計・ブラウザ言語自動切り替え）
- [ ] Stripe設計
- [ ] お問い合わせ導線
- [ ] SNS公式アカウント開設（X）
- [ ] 語源ネタ投稿開始（週1〜2本）
- [ ] クローズドWeb版公開

### 2026年5月
- [ ] 熟語保存
- [ ] Stripe実装・月500円プラン
- [ ] 100件保存制限（テストユーザー反応を見てから）
- [ ] 単語ページSEO対応（認証なし公開・OGP・メタディスクリプション）
- [ ] サイトマップ生成
- [ ] **Web一般公開**

目標: 新規登録50人 / 月間利用者20人 / 有料会員3人 / 月商1,500円

### 2026年6月
- [ ] ダッシュボード（草グラフ・おすすめデッキ）
- [ ] Wordlist/クイズフィルター（未学習・苦手・久しぶり・語源・品詞）
- [ ] AIレコメンドデッキ（有料プラン候補）
- [ ] SEO：タイトルタグ最適化
- [ ] **課金開始**

目標: 新規登録100人 / 有料会員10人 / 月商5,000円

### 2026年7月〜
- [ ] iOS最小版の要件確定・開発開始
- [ ] LP英語版
- [ ] PV拡張・送客試験導入

### 2026年9月
- [ ] TestFlight開始

### 2026年12月
目標: 累計売上35〜40万円 / 有料会員70人

### 2027年2月
目標: 累計売上50万円 / 有料会員90人

### 機能バックログ
- [ ] プロフィール設定（EN/JA切り替え）
- [ ] 熟語API選定（Collins / Longman / YouGlish）
- [ ] 語根ファミリーページ（`scrib` → subscribe / describe / manuscript）

---

## 設計方針・決定事項

- **語源抽出**: CSVカタログではなくAIが `rawEtymology` テキストから直接抽出（精度が高い）
- **辞書キャッシュ**: `RewrittenPayload` 形式で `dictionary_cache` に保存。first-write-wins
- **型安全**: `any` 型は禁止。共有型は `/app/types/` に集約（Dictionary.ts / Etymology.ts / DisplayLocale.ts など）
- **LP言語**: グローバル設計。ブラウザ言語設定に応じてEN/JA自動切り替え
- **課金**: Stripe、月500円プランを予定
- **本番直送**: 現段階はmainブランチ → Vercel本番で運用。ユーザーが増えたらdev/prodブランチ分離を検討

---

## よく使うコマンド

```bash
# フロントエンド開発
npm run dev

# 型チェック
npx tsc --noEmit

# サーバーデプロイ（rootlink_serverリポジトリで）
gcloud run deploy
```
