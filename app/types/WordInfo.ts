// types.ts
export type PartOfSpeech =
    | 'noun' | 'verb' | 'adjective' | 'adverb'
    | 'adjectival_noun' | 'pronoun' | 'preposition'
    | 'conjunction' | 'interjection' | 'particle'
    | 'auxiliary' | 'article';

    export type WordInfo = {
      saved_id: string | null;   // saved_words.id (保存されていない単語は null)
      word_id: string;           // words.id （辞書データの主キー）
    
      word: string;
      meaning: string;
      example?: string;
      translation?: string;
      partOfSpeech?: string[];
      pronunciation?: string;
    
      tags?: string[];
    };
    