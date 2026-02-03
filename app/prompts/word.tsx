export const wordPrompt = (word: string) => `
You are generating a learner-friendly dictionary entry for the English word "${word}".

GOAL:
- Help a Japanese learner remember this word correctly and easily.
- Prioritize memorability over academic completeness.

BASIC RULES:
- Use the input word as the base reference.
- If the input word is misspelled, infer the most likely correct spelling.
  - If corrected:
    - "query": original input
    - "normalized": corrected spelling
- If not corrected, set both to the input word.
- Return valid JSON only.

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
- Write ONE short, memorable sentence IN JAPANESE.
- The purpose is memory, not academic detail.
- You MAY briefly mention the original form (Old English / Latin etc.) if helpful.
- Do NOT write inspirational or generic statements.

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
    "text": "語源や元の意味を、日本語で覚えやすく一言で説明"
  }
}
`;
