export type LexicalUnitType =
    | 'idiom'
    | 'phrasal_verb'
    | 'fixed_expression'
    | 'spoken_expression'
    | 'collocation'
    | 'pattern'

    export type LexicalUnit = {
    phrase: string
    lexicalUnitType: LexicalUnitType
    meaning: string
    examples: {
        sentence: string
        translation: string
    }[]
}
