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

### リポジトリ責務の分担

| リポジトリ | 場所 | 作業内容 |
|-----------|------|---------|
| `rootlink_flashcard` | `/Users/takakowatabe/github/rootlink_flashcard` | UI・画面・Supabase連携・Vercelデプロイ。**通常の作業はここ** |
| `rootlink_server` | `/Users/takakowatabe/github/rootlink_server` | 辞書取得・AI rewrite・TTS・語源抽出。API変更・プロンプト修正時にここを開く |

CoworkやCodeで開くフォルダは基本 `rootlink_flashcard`。サーバー側の変更が必要な時だけ `rootlink_server` に切り替える。

---

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

> ソース: https://www.notion.so/RootLink-293d9703217a8067accef9cff447b4ad

### 2026年3月（完了）
- [x] dictionary_cacheキャッシュ構造整備（Oxford raw廃止）
- [x] wordlistのUI（コンパクトカード + モーダル）
- [x] TTS機能（イギリス英語・オンデマンド・Supabase Storage）
- [x] 語源パーツ構造化（root抽出・etymology_partsテーブル）
- [x] ピン留め機能（senseId単位）
- [x] 日英トグル（translations.ja対応）
- [x] Oxford Sandbox → 本番API切り替え

### 2026年4月
- [x] wordlistのUI
- [x] TTS機能
- [x] 独自ドメイン設定（rootlink.app）
- [x] プライバシーポリシー・お問い合わせ導線（Tallyフォーム）
- [x] Stripe設計・実装（月額¥500 / 年額¥4,800、早期割引UI）— 5月分を前倒し
- [x] 100件保存制限 + UpgradeModal — 5月分を前倒し
- [x] スペルミス自動補正・保存ボタン即時反映・PCヘッダー検索
- [ ] Stripeテスト（Webhook secret設定 → テストカードで動作確認）
- [ ] LP作成（EN/JA自動切り替え）
- [ ] 単語ページSEO対応（認証なし公開・OGP・メタディスクリプション）
- [ ] サイトマップ生成
- [ ] **クローズドWeb版公開**

### 2026年5月
- [ ] 熟語保存
- [x] Stripe実装・月500円プラン（4月に前倒し完了）
- [x] 100件保存制限実装（4月に前倒し完了）
- [ ] テストユーザー運用
- [ ] **Web一般公開**

目標: 新規登録50人 / 月間利用者20人 / 有料会員3人 / 月商1,500円 / 月間PV3,000

### 2026年6月
- [ ] 送客枠の試験導入・PVが取れる単語群の見極め
- [ ] iOS最小版の要件整理開始・Apple Developer Program登録
- [ ] **課金開始**
- [ ] 送客導線の試験開始

目標: 新規登録100人 / 月間利用者40人 / 有料会員10人 / 月商5,000円 / 月間PV10,000

### 2026年7月
- [ ] PVが取れるページを増やす
- [ ] iOS最小版の画面と範囲を確定
- [ ] PV拡張フェーズ開始

目標: 新規登録150人 / 有料会員20人 / 月商10,000円

### 2026年8月〜9月
- [ ] iOS最小版の実装開始
- [ ] TestFlight開始（9月）

### 2026年12月
目標: 新規登録400人 / 有料会員70人 / 月商35,000円 / 累計売上35〜40万円

### 2027年2月
目標: 有料会員90人 / 累計売上50万円

---

## 設計方針・決定事項

- **語源抽出**: CSVカタログではなくAIが `rawEtymology` テキストから直接抽出（精度が高い）
- **辞書キャッシュ**: `RewrittenPayload` 形式で `dictionary_cache` に保存。first-write-wins
- **型安全**: `any` 型は禁止。共有型は `/app/types/` に集約（Dictionary.ts / Etymology.ts / DisplayLocale.ts など）
- **LP言語**: グローバル設計。ブラウザ言語設定に応じてEN/JA自動切り替え
- **課金**: Stripe、月500円プランを予定
- **本番直送**: 現段階はmainブランチ → Vercel本番で運用。ユーザーが増えたらdev/prodブランチ分離を検討
- **語源ツリーのインデックス**: `etymology_part_words`（part_text, word）はSupabaseトリガーで `dictionary_cache` から自動展開する。トリガー関数 `sync_etymology_part_words()` が `payload.etymologyData.structure.parts[]` を読んで UPSERT。ユーザーが単語を検索 → `dictionary_cache` 蓄積 → 自動で語根インデックスも育つ。手動シードは不要（ハイブリッド戦略：初期は主要語をCoworkで先行検索して厚みを出す、以降はユーザー検索で自然成長）

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
