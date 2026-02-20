export const wordPrompt = (word: string) => `
You are generating a learner-friendly dictionary entry for the English word "${word}".

GOAL:
- Help a Japanese learner remember this word correctly and easily.
- Prioritize memorability over academic completeness.

BASIC RULES:
- Treat the input word as already resolved and correct.
- Use the input word exactly as-is for both "query" and "normalized".
- Your job is only to generate senses, examples, translations, and etymologyHook for that exact word.


MEANING & SENSE RULES (CORE):
- Meanings are LABELS, not explanations.
- If one simple Japanese word is enough, use ONLY that word.
- Do NOT add commas, extra phrases, or full sentences unnecessarily.
- HOWEVER:
  - If the word has clearly different meanings ACROSS PARTS OF SPEECH,
    you MUST create separate senses for each part of speech.
  - Verb meanings MUST NOT be merged into noun meanings.
  - Adjective meanings MUST NOT be merged into noun or verb meanings.
- Do NOT force sense splitting within the SAME part of speech.
- 1–3 senses is preferred.

PART OF SPEECH (MANDATORY):
- Each sense MUST include at least one basic part of speech.
- Use simple labels only: noun, verb, adjective, adverb.

CONTENT RULES:
- Use Japanese ONLY for "meaning" and "translation".
- Use natural, everyday Japanese.
- Do NOT write dictionary-style definitions.
- Examples must clearly match the meaning and part of speech.
- Do NOT include synonyms, antonyms, or related words.

PRONUNCIATION:
- Pronunciation belongs to the WORD level only.

ETYMOLOGY HOOK (MANDATORY):
- ALWAYS include an etymologyHook.
- The etymologyHook MUST be ONE of the following 3 types:
  - Type A: Parts-based (reusable parts)
  - Type B: Origin-based (has origin meaning but not decomposable)
  - Type C: Pure image (no useful origin/parts)
- Choose the type with the following priority:
  1. Type A
  2. Type B
  3. Type C
- Do NOT output any explanation, notes, or commentary about why you chose the type.

Type A requirements:
- Provide 1–3 reusable parts (prefix/root/suffix).
- For each part, provide:
  - part: the string (e.g., "mal")
  - meaning_en_short: a very short English gloss (1–3 words)
  - origin_language: one short label (e.g., "Latin", "Greek", "French", "Old English")
  - related_words: 1–3 real English words that share the SAME part
- Provide hook_ja as ONE short, memorable sentence in Japanese.
- Do NOT include academic detail or extra sentences.

Type B requirements:
- Not decomposable into reusable parts, but the origin form/meaning helps memory.
- Provide:
  - origin_language
  - origin_form (the historical form if known; otherwise empty string)
  - origin_meaning_en_short (1–6 words)
- Provide hook_ja as ONE short, memorable sentence in Japanese.

Type C requirements:
- No useful origin/parts. Do NOT force etymology.
- Provide hook_ja as ONE short, memorable sentence in Japanese that is a concrete situation/image.

GLOBAL HOOK RULES:
- hook_ja MUST be exactly ONE sentence.
- Do NOT write inspirational or generic statements.
- Do NOT include explanation text or annotations outside the JSON.
- origin_language MUST NOT be included inside hook_ja. Put it in fields only.

OUTPUT FORMAT:
Return a single JSON object.
Do NOT include anything outside the JSON.

{
  "query": "${word}",
  "normalized": "${word}",
  "pronunciation": "",
  "senses": [
    {
      "meaning": "日本語の短いラベル（できれば一語）",
      "partOfSpeech": ["verb"],
      "example": "A natural English sentence.",
      "translation": "例文の自然な日本語訳"
    }
  ],
  "etymologyHook": {
    "type": "A",
    "hook_ja": "日本語で覚えやすい1文。",
    "parts": [
      {
        "part": "mal",
        "meaning_en_short": "bad",
        "origin_language": "Latin",
        "related_words": ["malicious", "malfunction", "malnutrition"]
      }
    ],
    "origin_language": "",
    "origin_form": "",
    "origin_meaning_en_short": ""
  }
}
`;
