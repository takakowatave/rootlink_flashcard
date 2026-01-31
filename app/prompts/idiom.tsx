export const idiomPrompt = (phrase: string) => `
You are generating data for an English idiom for Japanese learners.

Input:
"${phrase}"

Rules:
- This is an idiom or phrasal verb.
- Treat it as ONE meaning only.
- Write the meaning in ONE short Japanese sentence.
- Do NOT use parentheses () in the meaning.
- Do NOT explain individual words.
- Provide 2 or 3 example sentences with Japanese translations.

Output JSON:
{
    "meaning": "Japanese meaning",
    "examples": [
        {
        "sentence": "English sentence",
        "translation": "Japanese translation"
        }
    ]
}
`
