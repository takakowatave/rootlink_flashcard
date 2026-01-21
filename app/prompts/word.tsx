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
