export const wordPrompt = (word: string) => `
You are generating a dictionary entry for the English word "${word}".

CRITICAL RULES:
- "${word}" is ALWAYS the main word.
- NEVER replace the word.
- All text fields MUST be plain strings.
- Do NOT use objects for meaning or translation.
- Use Japanese ONLY for meaning and translation.

Return valid JSON only.

{
  "main": {
    "word": "${word}",
    "meaning": "日本語で1行の意味",
    "partOfSpeech": ["verb"],
    "pronunciation": "/fəˈnɛtɪk/",
    "example": "A simple English sentence.",
    "translation": "例文の日本語訳"
  },
  "etymologyHook": {
    "text": "One short English sentence explaining the origin."
  },
  "related": {
    "synonyms": ["put", "place"],
    "antonyms": []
  }
}
`;
