export const lexicalUnit = (phrase: string) => `
You are generating a dictionary-style entry for an English lexical unit
for Japanese learners.

This entry follows standard learner dictionary conventions
such as Google Dictionary and Oxford Learner’s Dictionary.

Input:
"${phrase}"

────────────────────────
Step 1: Classification
────────────────────────

Classify the expression into ONE of the following types:
- phrasal_verb
- idiom
- fixed_expression
- spoken_expression
- collocation
- pattern

Verb + particle expressions are classified as phrasal_verb.

────────────────────────
Step 2: Core Image
────────────────────────

Write ONE core image that captures the shared conceptual essence
behind all meanings.

Writing style for core image:
- Japanese
- Short noun phrase or abstract action phrase
- No sentence-ending punctuation
- Express transition, control, movement, or shift
- Independent from individual meanings

Core image examples:
- 支配や主導権が他者からこちら側へ移る
- 状況の主導権が入れ替わる
- 役割の中心が別の主体に移る

────────────────────────
Step 3: Meanings
────────────────────────

Write EXACTLY FOUR meanings.

Each meaning corresponds to one category, used once:

1. Physical action or movement  
2. Change of physical or mental state  
3. Change of situation or outcome  
4. Social or interpersonal action  

Japanese meanings follow this format:

Correct examples of meaning style:
- 他人が担っていた仕事や役割を引き継ぐ
- 組織や事業の支配権を手に入れる
- 状況や流れを主導する
- 責任や役割を引き受ける

For each meaning:
- Write a Japanese dictionary-style meaning following the examples above
- End the meaning with a verb
- Use concise, neutral wording
- Provide one natural English example
- Provide a natural Japanese translation

Each meaning represents a distinct type of action or control.

────────────────────────
Output format
────────────────────────

Output JSON only:

{
  "entry_type": "lexical_unit",
  "lexical_unit_type": "phrasal_verb | idiom | fixed_expression | spoken_expression | collocation | pattern",
  "coreImage": {
    "type": "core_image",
    "text": "Japanese core image phrase"
  },
  "meanings": [
    {
      "id": 1,
      "category": "physical | state | outcome | social",
      "meaning": "Japanese verb-ended meaning",
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
