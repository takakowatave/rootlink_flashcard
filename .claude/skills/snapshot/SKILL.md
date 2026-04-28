---
name: snapshot
description: RootLinkプロジェクトの現状サマリーを Supabase から取得して整形する。ユーザーが「スナップショット」「現状」「数字どう？」「今月の数字」「KPI」「進捗」などを尋ねたら必ず使う。週次の振り返り、Stripe設定後の確認、ロードマップ更新時の指標取得などに使う。検索回数・登録ユーザー数・有料会員・MRR・キャッシュ件数などを一気に集計したい場合に必ず起動する。
---

# snapshot

RootLinkプロジェクトの現状を一発で把握するためのスキル。Supabase MCP で SQL を直接叩き、結果を kiko さん向けに整形して返す。

## 何を出すか

以下を取得して Markdown レポートにまとめる。

- **ユーザー**: 登録ユーザー数 / 直近7日の新規登録数
- **コンテンツ**: words 件数 / dictionary_cache 件数 / etymology_part_words 件数
- **エンゲージメント**: saved_words 総数 / quiz_results 直近7日数
- **課金**: アクティブな premium / trialing 数（subscriptions テーブル）
- **語源カバレッジ**: etymology_part_words の TOP10 語根（part_text と word_count）

## 使うツール

Supabase MCP の `execute_sql`。プロジェクトIDは `ybfdlsjuscgspkcgwist`（rootlink本番）。

複数のクエリは1回の `execute_sql` 呼び出しに `;` 区切りでまとめて投げると速い。

## SQL テンプレート

以下のクエリを順に実行する。スキーマは時間とともに変わる可能性があるので、エラーが出たら `information_schema.columns` で確認してから直す。

```sql
-- ユーザー
SELECT COUNT(*) AS total_users FROM auth.users;
SELECT COUNT(*) AS new_users_7d FROM auth.users WHERE created_at > NOW() - INTERVAL '7 days';

-- コンテンツ
SELECT COUNT(*) AS words FROM words;
SELECT COUNT(*) AS dict_cache FROM dictionary_cache;
SELECT COUNT(*) AS part_word_pairs FROM etymology_part_words;

-- エンゲージメント
SELECT COUNT(*) AS saved_words FROM saved_words;
SELECT COUNT(*) AS quiz_7d FROM quiz_results WHERE created_at > NOW() - INTERVAL '7 days';

-- 課金（subscriptions のスキーマは確認が必要）
SELECT status, COUNT(*) FROM subscriptions GROUP BY status;

-- 語源カバレッジ TOP10
SELECT part_text, COUNT(*) AS word_count
FROM etymology_part_words
GROUP BY part_text
ORDER BY word_count DESC
LIMIT 10;
```

## 出力フォーマット

短く、kiko さんが朝3秒で読める形に。数字だけ並べる。コメントや解釈は最小限。

```markdown
# RootLink Snapshot — YYYY-MM-DD

## ユーザー
- 登録: X人（直近7日 +Y人）

## コンテンツ
- words: X / dictionary_cache: Y / part_word_pairs: Z

## エンゲージメント
- 保存単語: X / クイズ直近7日: Y

## 課金
- premium: X / trialing: Y

## 語源カバレッジ TOP10
| part | 単語数 |
|------|-------|
| spect | 7 |
| ...   | ... |

## 気づき
- （目立つ変化や、前回比較できれば差分を1〜2行）
```

## なぜこの形か

- kiko さんは一人開発オーナーで、月曜朝や Stripe 設定後など「今どうなってる？」を頻繁に確認するフェーズにいる
- 数字の羅列を見て自分で判断したいので、解釈を押し付けない
- 「気づき」は最後に1〜2行だけ。前回スナップショットがあれば差分も出すと便利

## 過去スナップショットの保存

実行のたびに `.claude/snapshots/YYYY-MM-DD.md` に保存しておくと、次回実行時に前回比較ができる。ディレクトリがなければ作る。
