---
name: close-issue
description: 実装完了した Notion Issue Tracker の issue を「完了」に更新し、実装ログを content に append する。commit を push した直後に必ず呼ぶ。「クローズして」「issue 閉じて」「Notion 更新して」も同じ意味で発火する。
---

# close-issue

RootLink の Notion Issue Tracker (`https://app.notion.com/p/c85be6c7231a45ab89568e2d689e2625`) の issue を、実装完了と同時に閉じるための skill。

`commit push → skill 呼び出し` の 2 ステップを固定化することで、Notion status の取りこぼしを無くす。

## いつ呼ぶか

- `git push` を実行して develop に反映した**直後**
- kiko から「クローズして」「Notion 反映して」「issue 閉じて」と言われたとき
- Must リスト提示前の棚卸しで完了済みが見つかったとき

判断が付かないとき (対応する issue が特定できない・部分実装) は呼ばず、kiko に確認する。

## 引数

- `page_id` (必須): Notion issue の page id (dash 有無どちらでも可)
- `commit_hash` (任意): 実装した commit の短縮 hash。未指定なら直近の HEAD を使う
- `note` (任意): 実装ログ本文。未指定なら commit message + 変更ファイル要約から自動生成

## 手順

### 1. issue の現状 fetch

`mcp__claude_ai_Notion__notion-fetch` で `page_id` を取得。以下を確認:
- `ステータス` プロパティの現在値
- content 末尾 (append 位置決定用)

### 2. ステータス更新 (未完了なら)

`ステータス` が `完了` 以外の場合のみ、`mcp__claude_ai_Notion__notion-update-page` を `update_properties` で呼ぶ:

```json
{
  "command": "update_properties",
  "properties": { "ステータス": "完了" }
}
```

既に `完了` なら skip (今回のような "完了済 issue に追実装" ケースも想定)。

### 3. 実装ログ append

`update_content` で末尾に追記する。**必ず** `update_content` (`replace_content` 禁止・memory `feedback_notion_no_full_replace.md`)。

書式は以下で固定:

```markdown
### YYYY-MM-DD 実装 (commit XXXXXXX)
<note 本文 (1〜4行)>
```

- `YYYY-MM-DD` は today (env `currentDate`)
- `XXXXXXX` は commit 短縮 hash (7文字)
- 本文は箇条書き可・**絵文字禁止**・**色付き callout 禁止** (memory `feedback_no_emoji_no_color.md`)

`old_str` には content の末尾 1〜2 行を渡す。ページ全体を渡さない。

### 4. 結果報告

`✅ Notion 3cdd..3c9 更新完了 (ステータス=完了 / 実装ログ append)` のような 1 行だけ返す。長い要約禁止。

## やってはいけないこと

- `replace_content` (ページ全体書き換え) — kiko の書いた背景/受け入れ条件を消す
- 絵文字・色付き callout の挿入
- 「本当にクローズしていいですか?」の確認 — 呼び出し = 承認
- 対応する issue が不明なまま推測で更新
- 1 回で複数 issue をまとめて閉じる (issue ごとに 1 回呼ぶ)

## 呼び出し例

```
/close-issue 3cdd9703217a8036814ad598151fc3c9 338e1c7 "description 継承を追加。from XXX テンプレを wordFamily の非壊れ description で置換。"
```

引数省略時:

```
/close-issue 3cdd9703217a8036814ad598151fc3c9
```
→ 直近 HEAD commit / commit message から note を生成。
