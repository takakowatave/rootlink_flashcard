// WordInfo.ts
export type PartOfSpeech =
    | 'noun' | 'verb' | 'adjective' | 'adverb'
    | 'adjectival_noun' | 'pronoun' | 'preposition'
    | 'conjunction' | 'interjection' | 'particle'
    | 'auxiliary' | 'article';

    export type WordInfo = {
      saved_id?: string | null;
      word_id?: string;
    
      word: string;
      meaning: string;
      example?: string;
      translation?: string;
      partOfSpeech?: string[];
      pronunciation?: string;
    
      tags?: string[];
    };
    
    