export const wordPrompt = (word: string) => `
You are generating a dictionary entry for the English word "${word}".

CRITICAL RULES:
- Use the input word as the base reference.
- If the input word is misspelled, infer the most likely correct spelling.
- If the input word is misspelled:
  - Set "query" to the original input word.
  - Set "normalized" to the corrected spelling.
  - Use the corrected spelling as main.word.
- If the input word is correct:
  - Set both "query" and "normalized" to the input word.
  - Use the input word as main.word.
- All text fields MUST be plain strings.
- Do NOT use objects for meaning or translation.
- Use Japanese ONLY for meaning and translation.

Return valid JSON only.
The response MUST be a single JSON object.
Do NOT repeat, reprint, or restate any fields outside the JSON object.
The output must start with "{" and end with "}".

{
  "query": "${word}",
  "normalized": "${word}",
  "main": {
    "word": "${word}",
    "meaning": "日本語で1行の意味",
    "partOfSpeech": [],
    "pronunciation": "",
    "example": "A simple English sentence.",
    "translation": "例文の日本語訳"
  },
  "etymologyHook": {
    "text": "One short English sentence explaining the origin."
  },
  "related": {
    "synonyms": [],
    "antonyms": []
  }
}
`;
