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
- OpenAI API（gpt-4o） — AI rewrite・語源パーツ抽出・日本語訳
- OpenAI TTS — 音声生成（イギリス英語）

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

## 外部サービス & プラン

| サービス | プラン | 上限・コスト | 備考 |
|---------|--------|------------|------|
| Oxford Dictionaries API | **API Lite** | £50/月（年£600）/ 5,000 calls/月 / 超過 £0.05/call | 1単語検索 = 1〜数call |
| OpenAI | **gpt-4o**（従量課金） | — | rewrite・語源抽出・TTS。唯一の有料サービス |
| Supabase | Free | プロジェクトID `ybfdlsjuscgspkcgwist` | 本番DB |
| Vercel | Free（Hobby） | ドメイン `rootlink.app` | フロント |
| Stripe | — | 月額¥500 / 年額¥4,800（早期割引UI） | 本番決済・Webhook・Supabase書き込み確認済み（2026-06-05） |

### Cloud Run API エンドポイント

ベースURL: `https://rootlink-server-v2-774622345521.asia-northeast1.run.app`

- `POST /resolve` — 単語検索（query: string）。Oxford → AI rewrite → `dictionary_cache` 保存。**認証不要**
- `POST /chat` — チャット系。Bearer token 必要

---

## 実装済み機能

- 単語検索（Oxford + AI rewrite + キャッシュ）
- TTS音声（イギリス英語・オンデマンド生成・Supabase Storage）
- 語源フック・語源パーツ表示（AI抽出 → DB自動蓄積）
- 単語保存 + ピン留め（sense単位）
- Wordlist UI（コンパクトカード + モーダル詳細）＋ダッシュボード（オリジナル単語リスト・デッキ一覧）
- ストリーク表示（Headerアバター隣に🔥N、user_streaksテーブル）
- クイズ機能（フラッシュカード・○/×・覚えた/まだ分岐・間違えた単語だけ再挑戦）
- オリジナル単語帳（/wordlist）にもクイズ導線を追加：進捗ドーナツ（習得済/要復習/未習得）＋出題範囲（ランダム/要復習）＋クイズボタン。デッキ詳細と同じ骨格に統一（`TriDonutChart` を共有コンポーネント化）。デッキ詳細からは簡易単語リストを削除
- 鉢植え成長（ダッシュボード・`PlantStatus`・累計ログイン日数で5段階・アセットは `public/plant/lv1〜5.png`）
- quiz_results テーブル（正誤・日時記録）
- オンボーディングチュートリアル（TutorialOverlay・5ステップ・完了判定は `profiles.tutorial_completed`）
- プライバシーポリシーページ
- サインアップ同意チェックボックス
- フッター（プライバシー・お問い合わせ）
- 独自ドメイン `rootlink.app`（2026年4月設定済み）

---

## 設計方針・決定事項

- **オンボーディング完了判定**: localStorageではなくDB（`profiles.tutorial_completed`）で管理。ブラウザ単位だとアカウント削除・再作成しても発火しないため。新規アカウントは必ず発火する。途中ステップのみユーザーIDごとのlocalStorageキーで保持
- **語源抽出**: CSVカタログではなくAIが `rawEtymology` テキストから直接抽出（精度が高い）
- **辞書キャッシュ**: `RewrittenPayload` 形式で `dictionary_cache` に保存。first-write-wins
- **型安全**: `any` 型は禁止。共有型は `/app/types/` に集約（Dictionary.ts / Etymology.ts / DisplayLocale.ts など）
- **LP言語**: グローバル設計。ブラウザ言語設定に応じてEN/JA自動切り替え
- **課金**: Stripe、月500円プランを予定
- **本番直送**: 現段階はmainブランチ → Vercel本番で運用。ユーザーが増えたらdev/prodブランチ分離を検討。開発中の確認は `develop` ブランチで行う
- **鉢植えの成長基準**: 連続ログイン（ストリーク）ではなく**累計ログイン日数**（`user_activity_log` の重複なし日付数 ≒ `activityDates.length`）に連動。一度休んでも枯れない設計。しきい値は `PlantStatus.tsx` の `PLANT_LEVELS` 定数（Lv2=3日/Lv3=7日/Lv4=14日/Lv5=30日〜）で調整
- **UI統一方針**: オリジナル単語帳（saved_words）とデッキ（deck_words）はクイズ・進捗表示で同じ骨格を共有。ただし一覧は単語帳側のみリッチ表示（`EntryCard`＋語源モーダル）を残す。デッキは大量語のため一覧を持たずクイズ起動に特化
- **dev環境の識別**: `DevBadge`（`app/components/DevBadge.tsx`）が `window.location.hostname` を判定し、本番ドメイン（rootlink.app / www.rootlink.app）**以外**（localhost・Vercelプレビュー=develop等）で左下にバッジを常時表示。本番のみ非表示。画像は `public/dev-badge.png`。dev確認用のSupabaseテストアカウントも別途あり（認証情報はpublicリポジトリに置かない）
- **語源ツリーのインデックス**: `etymology_part_words`（part_text, word）はSupabaseトリガーで `dictionary_cache` から自動展開する。トリガー関数 `sync_etymology_part_words()` が `payload.etymologyData.structure.parts[]` を読んで UPSERT。ユーザーが単語を検索 → `dictionary_cache` 蓄積 → 自動で語根インデックスも育つ。手動シードは不要（ハイブリッド戦略：初期は主要語をCoworkで先行検索して厚みを出す、以降はユーザー検索で自然成長）

---

## コーディングチェックリスト

コードを書く・レビューするときに必ず確認すること。

### Supabase クエリ
- `.limit()` が必ずついているか（未設定は全件取得になる）
- ユーザー入力をそのままクエリに渡していないか（長さチェック必須）

### 新規テーブル作成時（RLS必須）
- SQL（SQLエディタ・マイグレーション・スクリプト・AI/MCP生成DDL）で `CREATE TABLE` すると **RLSはOFF初期値**。しかもanon/authenticatedには自動でアクセス権が付くため、放置すると「anon keyで誰でも読み書き可能」になる（2026-07に実際に9テーブルで発生）
- 新規テーブルは必ずセットで `alter table ... enable row level security;` ＋ 適切なポリシーを書く（参照系=公開SELECTのみ / ユーザーデータ=`auth.uid() = user_id`）
- 書き込みはservice_role（Cloud Run・スクリプト）経由なので、公開読み取り以外のポリシーは基本作らなくてよい（service_roleはRLSをバイパス）
- DDL変更後は `get_advisors(type: security)` を回してRLS漏れ・過剰ポリシーを確認する

### useEffect
- 依存配列に配列・オブジェクトが入っている場合、`useMemo` / `useCallback` で参照を安定させているか
  - `filter()` / `map()` 等は毎レンダーで新しい参照を生成するため無限ループの原因になる
- エラーハンドリング（try/catch または `.catch()`）が抜けていないか

### データ取得の設計
- 同じAPIを複数コンポーネントが個別に叩いていないか
  - 原則：**親で取得して props で渡す**。子が独立してフェッチするのは避ける

---

## センテンスマイニング → phrase_cards 追加フロー

エッセイ等から抽出した英語表現を `phrase_cards` に追加するときは、以下を必ず守る。

**仕様の正本**:
- Notion「フレーズ」ページ: `https://app.notion.com/p/39ad9703217a80348b61c15062fa940c`
- リポ内ミラー: `scripts/phrase-cards-prompt.md`（Notionと差分があればNotionが正）

**判定は Claude 自身が行う（OpenAI を経由しない）**:
- `scripts/upsert-phrase-cards.mjs` の OpenAI ルートは使わない（二重課金になる）
- Notion spec の Step 1 判定 gate（NG1〜NG6）を Claude 自身が通し、gate 合格なら Step 2 の JSON ペイロードを組み立てる
- 書き込みは Supabase MCP の `execute_sql` で直接 INSERT

**書き込み時のカラム**:

| カラム | 内容 |
|---|---|
| `phrase` | 表現そのまま（型注釈・括弧内注記は含めない） |
| `meaning_ja` / `meaning_en` | Notion spec の Case B に従って生成 |
| `explanation_ja` / `explanation_en` | 同上 |
| `example_en` / `example_ja` | phrase を必ず含む自然な例文 |
| `type` | `idiom` / `phrasal_verb` / `pattern` / `fixed_expression` / `collocation` / `slang` の6つのみ（`spoken_expression` / `expression` は廃止・絶対に使わない） |
| `locale` | 原則 null。英/米固有時のみ `en-GB` / `en-US` |
| `register` | 原則 `neutral` |
| `skip_reason` | **gate 合格なら NULL**。gate 落ちの表現も記録として残したい場合は NG番号+短い説明を入れて INSERT（例: `'NG1: 冠詞つき名詞句'`）→ `/phrases` の「脱落」セクションに出る |
| `gate_checked_at` | `now()` |

**重複防止**:
- `phrase_cards.phrase` は UNIQUE 制約あり。同じ phrase を再 INSERT すると失敗する
- 事前に `SELECT id FROM phrase_cards WHERE phrase = $1 LIMIT 1` で確認するか、`ON CONFLICT (phrase) DO NOTHING` を使う

**確認画面**:
- dev `/phrases`（https://rootlink-flashcard-git-develop-kikos-projects-678edb16.vercel.app/phrases）が判定結果の目視確認画面
- 上「残す」= `skip_reason IS NULL`、下「脱落」= `skip_reason IS NOT NULL`
- 判定根拠のバッジ・reason表示はカードに出さない。セクション分割のみ

**やってはいけないこと**:
- ターミナルに判定結果一覧を長々と貼る（狭くて視認性が悪いと本人明言。/phrases で見る）
- OpenAI (gpt-4o) を判定・生成に使う（Claude 自身が判定する）
- 冠詞つき（`a` / `an` / `the` から始まる）や文まるごとを phrase_cards に入れる（Notion spec Step 1 gate で必ず弾く）

---

## 作業ルール（必ず守ること）

### デプロイ
- コード変更が完了したら、確認を求めずに即 `develop` ブランチへ commit & push する
- `develop` ブランチが存在しない場合は作成してから push する
- 本番（`main` へのマージ・Vercel 本番・`gcloud run deploy`）はユーザーから明示的に指示があったときのみ

### UI / スタイル
- カード・レイアウト等のスタイルは必ず共通コンポーネントを使う。ハードコード禁止
- 新しいUIを実装する前に必ずデザイン（構成・スタイル案）をテキストや擬似コードで提示し、承認を得てから実装する
- 共通コンポーネントを新規作成したら必ず Storybook のストーリーも追加する

### スコープ
- 頼まれていないことは絶対にやらない
- 「表現の話」をしているときに単語ページを触らない、など文脈外の変更は禁止
- DB の bulk 操作（UPDATE/DELETE 複数件）は必ずユーザーに内容を示して承認を得てから実行する

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
