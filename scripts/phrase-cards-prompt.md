# phrase_cards 挿入プロンプト

## タスク
以下の表現リストを解析し、Supabase の `phrase_cards` テーブルに INSERT SQL を生成してください。

## テーブル定義
```
phrase_cards (
  phrase        TEXT NOT NULL,   -- 表現そのまま（型注釈を含めない）
  meaning_ja    TEXT,            -- 日本語の意味（簡潔に）
  meaning_en    TEXT,            -- 英語の意味（簡潔に）
  explanation_ja TEXT,           -- 補足説明（日本語）
  explanation_en TEXT,           -- 補足説明（英語）
  example       TEXT,            -- 英語例文
  example_ja    TEXT,            -- 例文の日本語訳
  usage_tip     TEXT,            -- 覚えるポイント（省略可）
  type          TEXT,            -- 種別（下記から選択）
  locale        TEXT,            -- 'en-GB' または 'en-US'
  register      TEXT             -- 'neutral' / 'formal' / 'informal' / 'slang' / 'literary'
)
```

## type フィールドの選択肢（必ずこの値を使う）
| 値 | 説明 |
|----|------|
| `idiom` | 非合成・意味固定・構文生成不可（意味を直訳できない） |
| `phrasal_verb` | 動詞＋副詞／前置詞の定型表現 |
| `fixed_expression` | 意味は推測可能だが言い回しが固定 |
| `spoken_expression` | 会話機能語（相槌・反応・つなぎ） |
| `collocation` | 意味は合成可能だが自然な語の組み合わせ |
| `pattern` | 差し替え可能な構文テンプレート（〜 one's brains など） |
| `expression` | 上記に当てはまらない一般的な表現 |

## locale の決め方
- イギリス・オーストラリア・アイルランド固有の表現 → `en-GB`
- アメリカ固有の表現 → `en-US`
- **両方で使われる表現 → `en-GB`（アプリのデフォルト）**
- 片方にしか存在しない表現のみ明示的に区別する

## ルール
- `phrase` フィールドに `(conjunction)` などの型注釈を入れない
- `type` は必ず上記の値から選ぶ
- `locale` は両方で使われる表現なら `en-GB` にする
- `register` は基本 `neutral`。明らかにフォーマル・インフォーマルな場合のみ変更
- `meaning_ja` は短く端的に（〜する／〜のこと）
- `example` は自然な英文で。ソース文があればそれを使う
- `usage_tip` は非自明な使い方や注意点がある場合のみ入れる

## 出力形式
```sql
INSERT INTO phrase_cards (phrase, meaning_ja, meaning_en, explanation_ja, explanation_en, example, example_ja, usage_tip, type, locale, register)
VALUES
  ('...', '...', NULL, NULL, NULL, '...', '...', NULL, '...', 'en-GB', 'neutral'),
  ...;
```

---
## 入力表現リスト
（ここに今日学んだ表現を貼る）
