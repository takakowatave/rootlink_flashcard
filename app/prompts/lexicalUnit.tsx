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

Meaning guidelines:

- Write a natural Japanese meaning that reflects the nuance of the expression.
- Avoid over-general meanings such as
  "特定の方法で" or "あるやり方で".
- Do not explain individual words.

Rules:
- Choose exactly ONE type.
- Treat it as ONE meaning only.
- Write the meaning in ONE short Japanese sentence.
- Do NOT use parentheses () in the meaning.
- Provide 2 or 3 example sentences with Japanese translations.

Output JSON:
{
  "entry_type": "lexical_unit",
  "lexical_unit_type": "idiom | phrasal_verb | fixed_expression | spoken_expression | collocation | pattern",
  "meaning": "Japanese meaning",
  "examples": [
    {
      "sentence": "English sentence",
      "translation": "Japanese translation"
    }
  ]
}
`
