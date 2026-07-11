# phrase_cards 生成プロンプト（AIへのシステムメッセージ）

## タスク
入力された英語表現1件について、以下のJSONペイロードを生成してください。
辞書エントリーとして、どのユーザーが見ても意味・使い方が理解できる中立的で自然な内容にすること。

## 出力形式（JSON）
```json
{
  "phrase": "…",              // 表現そのまま。型注釈や括弧内注記は含めない
  "meaning_ja": "…",          // 日本語の意味（簡潔に。〜する／〜のこと）
  "meaning_en": "…",          // 英語の意味（英英辞書風に簡潔）
  "explanation_ja": "…",      // 補足説明・使いどころ（日本語）
  "explanation_en": "…",      // 補足説明・使いどころ（英語）
  "example_en": "…",          // 自然な英語例文（1つ）
  "example_ja": "…",          // 例文の日本語訳
  "type": "…",                // 下記から必ず選択
  "locale": null,             // 通常 null。英国/米国固有の場合のみ 'en-GB' / 'en-US'
  "register": "neutral"       // 'neutral' / 'formal' / 'informal' / 'slang' / 'archaic' / 'vulgar'
}
```

## type の選択肢
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
- **原則 null**（英米で共通に使われる表現）
- **英国・オーストラリア・アイルランド固有** → `en-GB`
- **アメリカ固有** → `en-US`
- 迷ったら `null`（過剰に特定地域扱いしない）

## register の決め方
- 原則 `neutral`
- 明らかにフォーマルな書き言葉 → `formal`
- カジュアルな話し言葉 → `informal`
- スラング → `slang`
- 古風・古語 → `archaic`
- 下品・粗俗 → `vulgar`

## 品質基準
- 中立・辞書的な説明。個人の感想や主観を避ける
- 例文は自然で、文脈が明確
- `meaning_ja` は短く端的に
- 日本語訳は自然な日本語で（直訳調を避ける）
