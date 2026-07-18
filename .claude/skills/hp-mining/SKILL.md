---
name: hp-mining
description: ハリポタ原作シーンから会話表現をマイニングして、rootlink phrase_cards INSERT + ブログ記事下書き markdown を同時生成する。「HPマイニング」「ハリポタから表現追加」「HP解説記事」「HP Shorts脚本」と言われたら必ず使う。
---

# hp-mining

Harry Potter 原作のシーンから英会話表現を抽出し、以下2出力を1コマンドで生成する：

1. **rootlink `phrase_cards` INSERT**（HP痕跡ゼロ・辞書中立）
2. **ブログ記事 markdown 下書き**（HP引用ブロック + `<phrase-card>` 埋め込み + YT `<iframe>`）

Notion マーケ戦略ページ `363d9703217a80e485c8f660535751ad`（1構文=1記事・rootlink.jp/blog/{slug}）に完全準拠。

---

## 入力フォーマット

kiko が投げてくる形：

```
シーン: "So, that's why you couldn't see the Thestrals until now."
出典: 不死鳥の騎士団 第X章 / 映画X時yy分zz秒
表現: so that's why (...)
YTショート: https://youtu.be/xxx（省略可）
```

複数表現を1シーンから取ることもある。表現を明示せず「このシーンから使えそうな表現を出して」と言われることもある — その場合は候補を提案してから進める。

---

## 手順

### 1. Notion spec を毎回 fetch
`notion-fetch` で `39ad9703217a80348b61c15062fa940c`（phrase-cards spec）を必ず読む。Notion が正本、リポ内 `scripts/phrase-cards-prompt.md` は差分あれば Notion 優先。

### 2. Step 0 正規化
- 小文字化
- 末尾 `.` `!` `?` 除去
- 動詞は原形
- 所有格は `one's`
- 人 slot は `someone` / `someone's`、物 slot は `something`
- **禁止**: `sb` / `sth` / `somebody`（スペルミスに見えると kiko 明言）

### 3. Gate 判定（NG1〜NG6）
Claude 自身が判定する（OpenAI 経由禁止・二重課金になる）。gate 落ちの扱い：

- 記録として残す価値あり（似た形式が今後出そう）→ `skip_reason` に `'NG番号: 短い理由'` を入れて INSERT（`/phrases` の「脱落」セクションに出る）
- HP固有名詞（Harry / Hogwarts など）→ NG2（エッセイ文脈依存）で skip、DB書き込みなし

### 4. gate 合格 → Case B ペイロード生成（senses[] 形式）
Notion spec の Case B に従う。**必ず senses 配列で書く**（単一意味でも 1 要素配列）。BrE 前提。`locale` は原則 null（辞書ラベルが `British` / `American` と明記されているときのみ `en-GB` / `en-US`）。`register` は原則 `neutral`。

**多義判定**: HP のシーンから抽出した表現が、辞書的に複数 sense を持つ場合（`take off`: 離陸 vs 普及、`push through`: 乗り越える vs 強引に通す等）は **senses 配列で複数要素を書く**。senses[0] が primary。詳細は Notion spec「多義対応 senses[] 構造」参照。

### 5. phrase_cards INSERT（senses カラム経由）
Supabase MCP `execute_sql`（プロジェクトID `ybfdlsjuscgspkcgwist`）で INSERT。

```sql
INSERT INTO phrase_cards (phrase, senses, type, register, locale, gate_checked_at)
VALUES (
  '{正規化済み phrase}',
  jsonb_build_array(
    jsonb_build_object(
      'sense_id', gen_random_uuid()::text,
      'meaning_ja', '...',
      'meaning_en', '...',
      'explanation_ja', '...',
      'explanation_en', '...',
      'example_en', '...',
      'example_ja', '...'
    )
    -- 多義の場合は 2 つめ以降の jsonb_build_object を , でつなぐ
  ),
  '{type}', 'neutral', null, now()
)
ON CONFLICT (phrase) DO NOTHING
RETURNING id;
```

既存 phrase の場合は `RETURNING` が空になるので `SELECT id FROM phrase_cards WHERE phrase = $1` で id を取り直す。フラットカラム（meaning_ja/en など）は DB トリガー `phrase_cards_sync_flat` が senses[0] から自動同期するので手書きしない。

**重要**: 各 sense の `example_en` に HP固有名詞（Harry / Ron / Hermione / Hogwarts / Dumbledore 等）は絶対に入れない。中立的な日常シーンで作る。

### 6. slug 生成
kebab-case 英語。`so that's why` → `so-thats-why`。所有格アポストロフィ除去、スペースはハイフン、非ASCII は削除。

### 7. ブログ記事 markdown 生成

タイトルテンプレート：`{phrase} の意味と使い方｜HP原作で学ぶUK English`

構成：

```markdown
# {phrase} の意味と使い方｜HP原作で学ぶUK English

> {原文セリフ}

（{シーン説明・キャラ名は最小限で "魔法学校の生徒A" のように書いてもよい}）

## 意味

{meaning_ja}

## ニュアンス・使い方

{explanation_ja を2〜3段落に膨らませる・UK English らしさに触れる}

## RootLinkで復習

<phrase-card id="{返ってきたuuid}" />

## 動画で聞く

<iframe width="560" height="315" src="https://www.youtube.com/embed/{videoId}" title="YouTube video player" frameborder="0" allowfullscreen></iframe>

（YTショート未指定なら「動画で聞く」セクションごと省略）

## 関連表現

（任意・同じ type / 同じスキーマの類例を 2〜3個・phrase_cards 内で SELECT して埋める）
```

### 8. posts INSERT SQL を書き出す

下書き（`published_at IS NULL`）として INSERT SQL を `/tmp/hp-{slug}-post.sql` に書き出す。**ターミナルに SQL 本体は貼らない**（視認性優先）。パスだけ示す。

```sql
INSERT INTO posts (title, slug, content, tags, published_at)
VALUES (
  '{title}',
  '{slug}',
  $BODY${markdown 全文}$BODY$,
  ARRAY['HP', 'UK English', '{typeラベル}'],
  NULL
);
```

※ `posts.slug` / `posts.published_at` は blog 統合の DB migration 後に有効。未マイグレの場合はスキップして markdown だけ返す。

---

## 出力フォーマット（kiko 向け）

ターミナルには**要約のみ**：

```
✅ phrase_cards INSERT: "so that's why" (uuid: abc123...)
✅ blog draft: /tmp/hp-so-thats-why-post.sql

- /phrases で phrase 確認
- 記事 markdown: /tmp/hp-so-thats-why-post.md（本文プレビュー用）
- 動画IDが省略された箇所は {videoId} プレースホルダのまま
```

判定結果一覧・SQL本体・markdown本文を長々貼るのは禁止（kiko 明言：狭くて視認性が悪い）。

---

## HP由来素材の扱いルール

| 場所 | HP痕跡 | 引用 |
|---|---|---|
| `phrase_cards` の全カラム | ゼロ | 禁止 |
| ブログ `content`（引用ブロック） | OK | 短く（数行）・キャラ名最小限 |
| ブログ「動画で聞く」iframe | OK | YTショートURLのみ |
| 画像生成する場合 | キャラ本人NG | 「魔法学校風」の世界観で示唆（Notion戦略ページと同じ方針） |

---

## やってはいけないこと

- OpenAI (gpt-4o) を判定・生成に使う（Claude 自身が判定）
- `phrase_cards` に HP固有名詞を入れる
- ターミナルに判定結果・SQL・markdown全文を長々貼る
- 冠詞つき（`a` / `an` / `the` から始まる）・活用形・具体的人称代名詞をそのまま入れる
- `somebody` / `sb` / `sth` を使う（`someone` / `something` / `one's`）
- `posts` テーブルに直接 `published_at = NOW()` で公開（必ず NULL の下書き経由・kiko の確認後に UPDATE）

---

## Notion マーケ戦略との整合

参照: `https://app.notion.com/p/363d9703217a80e485c8f660535751ad`

- **1構文=1記事**（`rootlink.jp/blog/{slug}`）
- **記事内 RootLink カード埋め込み**（生きたプロダクトデモ）
- **Shorts脚本 = そのまま記事化**（動画とブログの1対1連携）
- **末尾CTA**: 「RootLinkで復習しよう！」（自動生成 markdown の最後に含める）

これらから外れる判断は Notion 側を正とする。
