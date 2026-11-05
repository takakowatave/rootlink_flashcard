---
name: eiken1-roots
description: 英検1級の難解単語を、同じ語根・接辞ごとにまとめて語源で解説するブログ記事（下書き）とショート動画の台本を作る。「英検1級の語源記事」「語根で記事」「英検1級ショート」「次の語根」と言われたら必ず使う。
---

# eiken1-roots

英検1級デッキの単語を同じ語根でまとめ（チャンク化）、以下2つを作る。ハリポタの hp-mining / Cuppa English と同じ流れにそろえている。

1. **ブログ記事の下書き**（`posts` に `published_at = NULL` で INSERT・単語カード埋め込み）
2. **ショート動画の台本**（記事と同じ中身。Canva でそのまま作れる形）

方針の正本は Notion「英検1級難解単語の語源解説ショート」 https://app.notion.com/p/40dd9703217a8148b3ecc50e37e2ffe6 。食い違ったら Notion を正とする。

---

## 単位

**1語根 = 1記事 = 1本のショート**。1記事で扱う単語は 5〜7語。

## 入力

- 「spect で記事」のように語根を指定される
- 「次の語根」と言われたら、下の手順1で候補を3つ出して kiko に選んでもらう

---

## 手順

### 1. 語根の候補を出す（指定がないとき）

Supabase（プロジェクトID `ybfdlsjuscgspkcgwist`）で、英検1級デッキ（`deck_id = 'fd534c6c-13d2-4d01-a819-0120ec1c5b1b'`）の単語を `etymology_part_words` で語根ごとに数える。

```sql
with w as (select distinct lower(word) word from deck_words
           where deck_id = 'fd534c6c-13d2-4d01-a819-0120ec1c5b1b')
select e.part_text, count(distinct e.word) n, string_agg(distinct e.word, ', ') words
from etymology_part_words e join w on w.word = lower(e.word)
group by e.part_text having count(distinct e.word) >= 5
order by n desc limit 60;
```

- **選ぶのは意味を持つ語根・接頭辞**（spect, ject, cede, voc, tract, bene, mal など）。`-ate` `-ion` `-ous` `-ity` `-able` のような品詞を作るだけの接尾辞は記事にしない（「なるほど」が生まれない）
- `posts` に `slug = '{語根}'` がすでにあれば除外する
- 候補は「語根・意味・含まれる単語の例」を3つだけ短く出す

### 2. 単語を選ぶ

- その語根を含む英検1級デッキの単語から 5〜7語を選ぶ。語根の意味から単語の意味が一番素直にたどれるものを優先する
- **`dictionary_cache` にある単語だけを使う**。無い単語は記事から外す。単語検索（`/resolve`）を叩いて足すことはしない（Oxford / OpenAI の従量課金が発生する）
- 確認クエリ:
  ```sql
  select x.word from words x join dictionary_cache c on c.word_id = x.id
  where lower(x.word) in (...) limit 10;
  ```

### 3. 語源を確認し直す

`etymology_part_words` / `etymology_part_glosses` の日本語訳には誤りが混ざっている（例: `-ate` が「職位、役割」、`con-` が「強調の力」）。**DBの訳をそのまま書かない**。

- 各単語の語源を WebFetch で Etymonline（`https://www.etymonline.com/word/{word}`）から確認する
- 語根の意味・元の言語（ラテン語／ギリシャ語など）・分解（接頭辞＋語根＋接尾辞）を Etymonline と一致させる
- 民間語源・こじつけの分解は書かない。分解が不確かな単語は記事から外す

### 4. 記事を書く

**slug**: `{語根}` そのもの（例: `spect` → https://www.rootlink.app/blog/spect）。タイトル先頭の「{語根}」と slug が一致していることで、単語ページのカードと OGP が語根記事として扱う。旧形式 `eiken1-root-{語根}` は next.config.js で転送している

**タイトルの型**: `「{語根}」は「{意味}」。語源で覚える英検1級単語{N}選`

**tags**: `ARRAY['英検1級', '語源', '英単語', '{語根}']`

**本文の型**（Cuppa English の記事と同じ骨格）:

```markdown
{導入1〜2文。この語根がどんな単語に入っているか}

{語根の説明。元の言語と意味を<mark>で強調}

## 「{語根}」が入った英検1級単語{N}選

| 単語 | 分解 | 意味 |
| --- | --- | --- |
| {word} | {pre} + {root} + {suf} | {意味} |

## ① {word}｜{意味}

{分解の説明。<mark>{pre}（〜）+ {root}（〜）</mark>で「〜」という形}

{語源の意味から今の意味へのつながりを1〜2段落}

**{word}** を含む例文\\
例文の和訳

<word-card word="{word}" />

（②以降も同じ）

## まとめ

{語根の意味をもう一度短く。覚え方のコツを1〜2文}

<word-list words="{word1},{word2},..." />
```

- 番号は ①②③… を使う
- **単語カードの意味を見出しに合わせる**: `<word-card>` はデフォルトで最初の意味が出る。記事で扱う意味が別なら `sense="N"` を付ける。N は `dictionary_cache.payload.senseGroups` を品詞をまたいで先頭から数えた通し番号（例: advocate は名詞4つの後なので動詞は `sense="5"`）
- **本文の例文をカードの例文とかぶらせない**: カードの例文（`senseGroups[].senses[].example`）を先に見て、別の場面の例文を書く
- 例文は1文。単語は `**` で太字。英文と和訳の間は `\\` で改行（既存記事と同じ）
- 見出しの区切りは全角の縦棒「｜」
- 本文に「RootLinkで復習」などの CTA 見出しは書かない（ブログテンプレ側に共通 CTA がある）
- YouTube ショートが公開済みなら、まとめの前に「## 動画で見る」と `<iframe>` を入れる（未公開なら入れない）

### 5. posts に下書きで INSERT

```sql
INSERT INTO posts (title, slug, content, tags, author_key, published_at)
VALUES ('{title}', '{slug}', $BODY${markdown 全文}$BODY$, ARRAY[...], 'kiko', NULL)
ON CONFLICT (slug) DO NOTHING
RETURNING id, slug;
```

著者は `author_key = 'kiko'`（2026-11-05 kiko 指定）。**`published_at` は必ず NULL**。INSERT 後は Claude in Chrome で `/blog/preview/{slug}` を開き、カードの意味と例文が記事と合っているかを確認してから報告する（WebFetch は robots で弾かれる）。プレビューで kiko が確認して「公開して」と言ってから公開する。

**公開は毎朝 7:00（JST）に1本ずつ予約する**（2026-11-05 kiko 決定）。kiko が承認した下書きを、まだ語根記事が入っていない一番早い日の 7:00 に並べる。

```sql
-- 予約済みの最終日を確認
select max(published_at) at time zone 'Asia/Tokyo' from posts where title ~ '^「[^」]+」は「' and slug = lower(substring(title from '^「([^」]+)」'));
-- 翌日以降の空いている日の 07:00 JST に予約（例）
update posts set published_at = '2026-11-06 07:00+09' where slug = 'xxx' and published_at is null;
```

ブログは未来日付の記事を出さないので、7:00 になると自動で公開される。

### X への投稿は自動（週1回のまとめ）

記事とショート動画は毎日出すが、X は毎朝だとうるさいので週1回にまとめる（2026-11-05 kiko 決定）。毎週日曜 9:41 に予約タスク「RootLink 語根記事のXまとめ投稿（毎週日曜）」が動き、過去7日に公開された語根記事をまとめて @RootlinkJapan に 10:30 で予約投稿する（Metricool の RootLink ブランド経由、最新記事の表紙画像つき、リンクは最初のリプ）。このスキルで X に直接投稿しない。

### 語源の出典

記事の末尾（`<word-list>` の後）に必ず入れる。

```markdown
## 語源の出典

各単語の語源は [Online Etymology Dictionary](https://www.etymonline.com/) で確認しています。
```

### 6. ショート動画の台本を作る

記事と同じ中身を、Canva でそのまま組める形にする。1ページ＝1画面。

```
P1 フック: 「{word1}・{word2}・{word3}…全部 {語根} でつながる」
P2 語根: {語根} ＝ {元の言語}「{意味}」
P3〜: 1単語1ページ
      {word}
      {pre} + {root} + {suf}
      → {意味}
まとめP: 「{語根} でつながる{N}語」と単語を一覧
クイズP: 動画に出てこない同じ語根の単語を1つ出し、分解チップをヒントに3択で問う
         「わかったら番号をコメントで！」。答えは動画で出さず固定コメントに書く
最終P: ロゴ＋「ストアで RootLink と検索」＋「解説記事はプロフィールのリンクから」
```

台本は `docs/eiken1-roots/{slug}-short.md` に書き出す（リポジトリ内・commit 対象）。固定コメント用の答えの文も台本に書く。

- クイズの単語は語源を Etymonline で確認し、記事の単語と重ならないものを選ぶ
- 選択肢は正解1つ＋語根の意味からもっともらしく見える誤答2つ

### 7. kiko への報告

返答は**要約だけ**。記事本文・SQL・台本の全文を貼らない。

```
✅ posts INSERT（下書き）: slug=spect（6語）
- プレビュー: https://www.rootlink.app/blog/preview/spect
- ショート台本: docs/eiken1-roots/spect-short.md
- 外した単語: inspectorate（キャッシュなし）
- OK なら「公開して」と言ってください
```

---

## 文章のルール

- 長いダッシュ（——）と全角セミコロン「；」は使わない
- 句読点を多用しない。冗長にしない
- 例文は1文

## やってはいけないこと

- `published_at` を入れて INSERT する（必ず下書き → プレビュー → kiko の「公開して」）
- キャッシュに無い単語のために単語検索を叩く（課金事故）
- DB の語根訳を確認せずに書く
- 接尾辞だけの「語根」で記事を作る
- Canva・Metricool で勝手に公開・予約する（投稿は kiko が動画を見て了承してから）
