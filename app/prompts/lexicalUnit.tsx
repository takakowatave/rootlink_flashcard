export const lexicalUnit = (phrase: string) => `
You are generating data for an English lexical unit for Japanese learners.

Input:
"${phrase}"

First, classify this lexical unit into ONE of the following types:
- idiom
- phrasal_verb
- fixed_expression
- spoken_expression
- collocation
- pattern

Classification guidelines:

- Idioms are fixed expressions whose meanings are not directly literal.
- If an expression follows a common and productive pattern
  (e.g. "in a ___ way / fashion / manner"),
  it should generally NOT be classified as an idiom.
- Well-established expressions commonly found in dictionaries
  may still be classified as idioms.

Meaning generation guidelines:

- Generate BETWEEN 1 AND 5 meanings.
- Only include meanings that are clearly distinct and commonly recognized in major dictionaries.
- Do NOT split meanings by minor nuance, tone, or register.
- If multiple meanings exist, order them by commonness.
- Each meaning must be expressible as ONE short Japanese sentence.
- Avoid vague or over-general Japanese such as
  "特定の方法で" or "あるやり方で".
- Do NOT explain individual words.
- Do NOT use parentheses () in meanings.

Examples guidelines:

- Provide 2 or 3 example sentences PER meaning.
- Examples must clearly match the meaning they belong to.
- Write natural English sentences.
- Provide accurate and natural Japanese translations.

Rules:

- Choose exactly ONE lexical_unit_type.
- Meanings must be clearly separable and non-overlapping.
- Do NOT generate more than 5 meanings even if more nuances exist.

Output JSON:
{
  "entry_type": "lexical_unit",
  "lexical_unit_type": "idiom | phrasal_verb | fixed_expression | spoken_expression | collocation | pattern",
  "meanings": [
    {
      "id": 1,
      "meaning": "Japanese meaning",
      "examples": [
        {
          "sentence": "English sentence",
          "translation": "Japanese translation"
        }
      ]
    }
  ]
}
`
