export const lexicalUnit = (phrase: string) => `
You are generating a practical, usage-focused explanation
of an English expression for Japanese learners.

The goal is to provide concise meanings that reflect
how this expression is commonly used in real situations,
similar to trusted learner dictionaries.

Input:
"${phrase}"

────────────────────────
Step 1: Classification
────────────────────────

Classify the expression into the most appropriate category
based on common usage:

- phrasal_verb
- idiom
- fixed_expression
- spoken_expression
- collocation
- pattern

────────────────────────
Step 2: Meanings
────────────────────────

Write the commonly used meanings of this expression.

Guidelines:
- Write 1–2 meanings
- Use concise, neutral, dictionary-style Japanese
- Meanings may be close paraphrases
- Focus on practical usage in conversation and work
- Each meaning should be safe and natural to use

For each meaning:
- End the Japanese meaning with a verb or verb phrase
- Provide ONE natural English example
- Provide a natural Japanese translation

────────────────────────
Output format
────────────────────────

Output JSON only:

{
  "entry_type": "lexical_unit",
  "lexical_unit_type": "phrasal_verb | idiom | fixed_expression | spoken_expression | collocation | pattern",
  "meanings": [
    {
      "id": 1,
      "meaning": "Japanese meaning",
      "examples": [
        {
          "sentence": "English example",
          "translation": "Japanese translation"
        }
      ]
    }
  ]
}
`
