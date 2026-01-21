/**
 * wordPrompt
 *
 * 【開発者向け説明（日本語）】
 * この関数は、英単語1語を入力として、
 * AI に「語源フック付き単語データ」を JSON 形式で生成させるための
 * プロンプト文字列を返す。
 *
 * ⚠️ 重要
 * - 下の英文は「AIに対する命令文」
 * - 人間が読むための説明ではない
 * - 生成結果の構造と品質を安定させるため、命令文は英語で固定
 *
 * ▼ 生成ルール概要
 * ■ Etymology Hook（語源フック）
 * - 必ず1文だけ
 * - 改行禁止
 * - 厳密さより「覚えやすさ」優先
 *
 * ■ Derived Words（派生語）
 * - 同じ語源・同じルートを持つ単語のみ
 * - 意味が似ているだけの単語は禁止
 * - 説明文は禁止（UI用データのため）
 * - 最大3語
 * - なければ空配列 []
 *
 * ■ Synonyms / Antonyms
 * - 必ず両方出す
 * - 各1〜2語
 * - 日常的で頻出の単語のみ
 */

export const wordPrompt = (word: string) => `
For the English word "${word}", return JSON ONLY in the exact format below.

All output must be in English.
Japanese is allowed ONLY in "meaning" and "translation".

========================
ETYMology Hook Rules
========================
- Must be EXACTLY ONE sentence.
- No line breaks.
- No explanations or hedging.
- Prioritize memorability over academic accuracy.

Choose ONE type:
Type A: prefix + root (+ suffix)
Type B: root-based hub (shared image)
Type C: origin-based (no clear segmentation)
Type D: pure image (no etymology)

========================
Derived Words Rules
========================
- Include ONLY words that share the same root or etymological origin.
- NO explanations.
- Max 3 words.
- If none exist, return [].

========================
Synonyms / Antonyms Rules
========================
- ALWAYS include both.
- 1–2 words each.
- Common, high-frequency words only.
- English words only.

========================
Return this JSON format
========================

{
    "main": {
        "word": "",
        "meaning": "",
        "partOfSpeech": [],
        "pronunciation": "",
        "example": "",
        "translation": ""
    },
    "etymologyHook": {
        "type": "A | B | C | D",
        "text": ""
    },
    "derivedWords": [
        {
        "word": "",
        "partOfSpeech": "",
        "pronunciation": "",
        "meaning": ""
        }
    ],
    "related": {
        "synonyms": [],
        "antonyms": []
    }
}
`;
