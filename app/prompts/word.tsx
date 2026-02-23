export const wordPrompt = (word: string, dictionaryJson: unknown = {}) => `
You are generating a learner-friendly dictionary entry for the English word "${word}" for Japanese learners.

IMPORTANT
- The input word is already resolved and correct.
- You MUST use the provided dictionaryJson as the primary source of truth.
- Keep the output JSON schema EXACTLY as specified. Do not add or remove keys.
- Output JSON only. No commentary.

INPUTS
- word: "${word}"
- dictionaryJson (Free Dictionary API response): ${JSON.stringify(dictionaryJson)}

GOAL
- Ground all content in dictionaryJson to reduce hallucination.
- Select only the most learnable core senses.
- Keep Japanese short and natural.

SENSE SELECTION (avoid too many senses)
- Output 1 to 3 senses total (hard limit: 3).
- Select senses supported by dictionaryJson meanings and definitions only.
- Prefer, in order:
  1) high-frequency, general-use senses
  2) senses with an example sentence in dictionaryJson
  3) the earliest senses in the list for each part of speech
- If dictionaryJson contains many near-duplicates, merge to the single most representative sense.
- Avoid rare, technical, archaic senses if the definition wording signals it (archaic, obsolete, historical, technical, chiefly, dialect).

MEANING (Japanese label)
- "meaning" is a short Japanese LABEL, not a full definition.
- Derive it from the chosen English definition, but compress it to a learnable label.
- Use Japanese only for meaning and translation.
- Avoid overly literal phrasing and avoid semicolons.

PART OF SPEECH
- Map dictionaryJson partOfSpeech to exactly ONE of: noun, verb, adjective, adverb.
- Each sense MUST have partOfSpeech as an array with exactly one item, e.g. ["verb"].

EXAMPLES
- If dictionaryJson has an example for the chosen definition, use it.
- Otherwise generate ONE natural example that clearly matches the chosen sense.
- Provide a natural Japanese translation for the example.
- Use British English spelling where applicable.

PRONUNCIATION
- If dictionaryJson contains phonetic or phonetics.text, set "pronunciation" to an IPA string.
- Prefer UK-style IPA when multiple are available (often includes "ɒ" as in /ˈvɒmɪt/).
- If none exists, set "pronunciation" to "".

ETYMOLOGY HOOK (MANDATORY)
- Use dictionaryJson etymology if present; otherwise generate.
- Choose exactly ONE type: "A", "B", or "C".
- Type A: only when you are confident about the decomposition. Do not guess.
- If uncertain, use Type B or Type C.
- One-sentence rule:
  - summary MUST be exactly ONE Japanese sentence.
  - hookJa MUST be exactly ONE Japanese sentence.
- When type is not A, set parts to [].
- When type is not C, set hookJa to "".

OUTPUT FORMAT (JSON only)
{
  "query": "${word}",
  "normalized": "${word}",
  "pronunciation": "",
  "senses": [
    {
      "meaning": "日本語ラベル",
      "partOfSpeech": ["noun"],
      "example": "A natural English sentence.",
      "translation": "自然な日本語訳"
    }
  ],
  "etymologyHook": {
    "type": "A",
    "summary": "語源の簡潔な1文。",
    "parts": [
      {
        "part": "example_part",
        "meaning": "短い意味",
        "relatedWords": ["word1", "word2"]
      }
    ],
    "hookJa": ""
  }
}

CONSTRAINTS
- Do NOT invent senses that are not supported by dictionaryJson.
- Do NOT include synonyms or extra fields.
- Do NOT output anything outside the JSON.
`;