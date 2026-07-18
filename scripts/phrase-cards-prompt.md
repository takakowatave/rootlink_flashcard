# phrase_cards 生成プロンプト（AIへのシステムメッセージ）

このプロンプトの唯一の spec は Notion「フレーズ」ページ（`https://app.notion.com/p/39ad9703217a80348b61c15062fa940c`）。以下はその spec を LLM が実行できる形に落とし込んだもの。両者に差分が出たら Notion 側を正とする。

## タスク

入力された英語表現1件について、次の順に処理する:

0. **正規化** — phrase テキストを辞書見出し形にそろえる
1. **判定 gate** — 辞書項目として成立するか判定
2. gate 合格 → JSON ペイロードを生成
3. gate 不合格 → skip 出力

## Step 0: phrase の正規化

判定・INSERT の前に、必ず以下を適用して**辞書見出し形**にそろえる。ソース文（マイニング元のエッセイ等）のまま入れない。

- **すべて小文字**（固有名詞を含む慣用句など、例外的に大文字を保つべき場合を除く）
- **末尾のピリオドを除去**（`.` `!` `?` 全部NG。辞書見出しに句読点は付かない）
- **括弧内注記を除去**（`nail it (informal)` → `nail it`）
- **動詞は原形**（`nailed it` / `nails it` / `nailing it` → `nail it`）
- **名詞は単数形**（`good ideas` → `good idea` ※そもそも NG1 で落ちる）
- **人・物の slot は `someone` / `something`**（`help John` → `help someone`。ただし NG3 で落ちる可能性大）
  - **略記 `sb` / `sth` は使わない**（ユーザーにはスペルミスに見える）
  - **`somebody` / `something` の `body` 系も使わない**。統一して `someone`（例: `give somebody space` → `give someone space`）
- **所有格 slot は主語との関係で分ける**:
  - 主語自身の所有物 → `one's`（`rack one's brains`, `keep one's options open`）
  - 他人の所有物 → `someone's`（`be after someone's blood` = 他人の血を欲する）
  - 略記 `sb's` は使わない
  - どちらか迷ったら Oxford / Longman の見出し形に従う
- **主語は原則入れない**（`I nailed it.` → `nail it`。NG6 と併せて処理）
- **AmE / BrE の綴り変種があるときは BrE を採用**（RootLink は Oxford ベース。`anesthesia` → `anaesthesia`, `color` → `colour`, `realize` → `realise`, `traveling` → `travelling`。本当にアメリカ固有の表現のみ `locale = 'en-US'` で例外扱い）

正規化後の phrase で改めて NG1〜NG6 を判定する。

## Step 1: 判定 gate

**単一の質問**: 主要な英英辞書（Oxford / Longman / Cambridge）が、この phrase を**独立エントリー、熟語見出し、または usage note** として立てるか。

- **YES** → Step 2 (JSON生成) に進む
- **NO** → skip 出力
- 迷ったら **NO**

### NGパターン（1つでも該当したら即 skip）

**NG1. 冠詞つきの塊**
- `a` / `an` / `the` から始まる。辞書見出しには冠詞は付かない
- 例: `a good idea`, `an important decision`, `the recent report`

**NG2. エッセイ文脈依存**
- 具体トピック語（固有名詞・限定的な名詞）と一般動詞の組み合わせで、その文脈を離れると成立しない

**NG3. 動詞 + someone / something だけ**
- 一般的な他動詞に目的語 slot を付けただけの塊。word entry の範疇
- 例: `see someone`, `hit someone`, `help someone`

**NG4. 基本文法パターン**
- 使役・知覚動詞などの SVOC 構造は grammar note の範疇であって、独立した辞書項目ではない
- 例: `make sb do sth` (SVOC使役), `let sb go`, `have sb do sth`
- **例外**: `verb + to-inf` の usage note（`agree to do sth`, `succeed in doing sth` など）は主要辞書に立つ → OK

**NG5. 字義通り＋際限のある組み合わせ（adj + N / verb + N）**
- 慣用性がゼロで、片方の語彙エントリー（形容詞/動詞/名詞）で吸収されるもの
- 基本形（adj + N）: `red car`, `interesting book`, `big house`
- **拡張ルール（際限テスト）**: アンカー語（adj or verb）+ 別の N を3つ以上並べて自然に成立するなら NG5 → skip

  **A. adj + N**（adj が汎用修飾語）
  - `mutual friend` / `mutual respect` / `mutual understanding` / `mutual acquaintance` / `mutual interest` / `mutual benefit` … 際限がない → `mutual` の語彙で吸収
  - 同型: `good idea` / `good point` / `great job` … 単体 adj のエントリーで足りる

  **B. verb + N**（light verb + action noun）
  - `make an incision` / `make a decision` / `make a call` / `make a mistake` / `make an effort` … 際限がない → `make` の light-verb 用法で吸収
  - 同型: `have a chat` / `take a shower` / `do the dishes` などは慣用性が低ければ skip

  **C. verb + 具象名詞クラス（体の一部・場所・道具など）で字義通り**
  - `twist one's ankle` / `twist one's knee` / `twist one's wrist` / `twist one's neck` … 際限がない → `twist` の verb 用法で吸収
  - 同型: `hurt one's ankle` / `bandage one's ankle` / `sprain one's ankle`

- **例外（NG5にならない）**: 比喩性・非合成性のある verb + 体の一部は **idiom** として残す
  - `break someone's heart` / `lose one's head` / `hold one's tongue` → 意味が字義から復元できない

**NG6. 文まるごと**
- 文単位ではなく辞書粒度で立てる。文の中に慣用性のある塊があれば、その部分だけ抽出
- 例: `You did a great job.` → 慣用性のある `do a great job` を抽出

## Step 2: type 判定ルール（gate 合格時、優先順位順）

以下の順に該当するか見て、**最初にYESの type を採用**する:

1. **`idiom`** — 意味が字義から復元できない（比喩・慣用）。slot があっても意味非合成なら idiom
2. **`phrasal_verb`** — 動詞 + 副詞/前置詞のセット
3. **`pattern`** — 差し替え可能な構文の枠が固定（`...` / `doing` / `to do` の slot）
4. **`fixed_expression`** — 語順固定で意味は合成的
5. **`collocation`** — 自然な組み合わせだが差し替えも可能
6. **`slang`** — スラングとして辞書に載っているもののみ

**廃止済み type（絶対に使わない）**:
- ❌ `spoken_expression` → `fixed_expression` に統合
- ❌ `expression` → 廃止

## 出力形式

### Case A. skip（gate 不合格）

```json
{
  "skip": true,
  "reason": "NG1: 冠詞つき名詞句"
}
```

- `reason` は該当した NG 番号 + 短い説明
- 複数該当したら最も強い理由1つを書く
- **前置き・コードフェンス・追加テキストは出力しない**

### Case B. accepted（gate 合格）

```json
{
  "phrase": "…",              // Step 0 で正規化した形（小文字・原形・末尾記号なし・one's / someone / something 使用。sb / sth / somebody は不可）
  "senses": [                 // 必ず配列。単一意味でも 1 要素配列で書く
    {
      "sense_id": "<gen_random_uuid()::text で生成>",
      "meaning_ja": "…",      // 日本語の意味（簡潔に）
      "meaning_en": "…",      // 英英辞書風に簡潔
      "explanation_ja": "…",  // 補足説明（日本語）
      "explanation_en": "…",  // 補足説明（英語）
      "example_en": "…",      // sense 個別の例文（phrase を必ず含む）
      "example_ja": "…"       // 例文の日本語訳
    }
  ],
  "type": "…",                // Step 2 の優先順位で決めた1つ
  "locale": null,             // 通常 null。英国/米国固有の場合のみ 'en-GB' / 'en-US'
  "register": "neutral"       // 'neutral' / 'formal' / 'informal' / 'slang' / 'archaic' / 'vulgar'
}
```

**senses[] の使い分け（2026-07-18 追加、Notion spec の「多義対応 senses[] 構造」に対応）**:

以下のどれかに該当したら **別 sense に分ける**:
- 物理的意味 vs 比喩的意味（`take off`: 離陸 vs 普及）
- 文脈が明確に異なる（`push through`: 個人が困難を乗り越える vs 議案を強引に通す）
- 主要英英辞書が別番号のエントリー / sub-sense として立てている

以下は **同一 sense のまま** meaning_ja に `；`（セミコロン）で言い換えを併記して OK:
- 同義言い換え（`early bird`: 「朝型の人；早くから行動する人」）
- 訳し分けのニュアンス差

**配列順が優先度**（senses[0] が primary）。primary は「そのシーンで meaning にしたい方」または「頻用される方」。

**フラットカラム（meaning_ja / meaning_en / explanation_ja / explanation_en / example_en / example_ja）は `senses[0]` から DB トリガー `phrase_cards_sync_flat` で自動同期される**ので、INSERT SQL では senses だけ書けば OK。

### SQL 実装例（Case B）

```sql
INSERT INTO phrase_cards (phrase, senses, type, register, locale, gate_checked_at)
VALUES (
  'push through',
  jsonb_build_array(
    jsonb_build_object(
      'sense_id', gen_random_uuid()::text,
      'meaning_ja', '踏ん張って乗り越える',
      'meaning_en', 'to continue despite difficulties',
      'explanation_ja', '…',
      'explanation_en', '…',
      'example_en', 'Whenever things get hard, you can either give up or push through.',
      'example_ja', '…'
    ),
    jsonb_build_object(
      'sense_id', gen_random_uuid()::text,
      'meaning_ja', '強引に通す',
      'meaning_en', 'to cause something to be officially accepted despite opposition',
      'explanation_ja', '…',
      'explanation_en', '…',
      'example_en', 'The government pushed the new law through despite fierce opposition.',
      'example_ja', '…'
    )
  ),
  'phrasal_verb', 'neutral', null, now()
)
ON CONFLICT (phrase) DO NOTHING
RETURNING id;
```

## locale の決め方

- **原則 null**（英米で共通に使われる表現）
- **英国・オーストラリア・アイルランド固有** → `en-GB`
- **アメリカ固有** → `en-US`
- 迷ったら `null`（過剰に特定地域扱いしない）
- **厳格ルール**: Oxford / Longman / Cambridge のいずれかが `British`, `especially British English`, `American`, `especially American English` 等のラベルを**明示している場合のみ** en-GB / en-US を付ける。「なんとなくBrEっぽい」で判断しない

## register の決め方

- 原則 `neutral`
- 明らかにフォーマルな書き言葉 → `formal`
- カジュアルな話し言葉 → `informal`
- スラング → `slang`
- 古風・古語 → `archaic`
- 下品・粗俗 → `vulgar`

## 品質基準

- 中立・辞書的な説明。個人の感想や主観を避ける
- **例文は必ず phrase を含む**（見出しと例文が乖離しない。`an egg-freezing procedure` で例文が「The procedure takes 20 minutes」になる、のような事故を防ぐ）
- 例文は自然で文脈が明確
- `meaning_ja` は短く端的に
- 日本語訳は自然な日本語で（直訳調を避ける）
- **`explanation_ja` / `explanation_en` に「活用形: rack / racked / racked / racking」のような活用形リストを入れない**（辞書の三変化表ではない。ユーザーは phrase の使い方を知りたいだけ）
- **JSON以外の文字（前置き・コードフェンス）は出力しない**
