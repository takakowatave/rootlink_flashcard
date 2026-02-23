export const translateDefinitionsPrompt = (
    word: string,
    definitions: string[]
  ) => `
  You are translating English dictionary definitions into natural Japanese.
  
  Word: "${word}"
  
  Definitions:
  ${definitions.map((d, i) => `${i + 1}. ${d}`).join('\n')}
  
  Rules:
  - Translate each definition faithfully.
  - Keep the same order.
  - Output JSON array only.
  - Format:
  
  [
    { "definition": "...", "translation": "..." }
  ]
  `