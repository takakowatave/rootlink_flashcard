// lib/pos.ts
import type { PartOfSpeech } from '@/types/WordInfo'; 
// 型定義をインポート。PartOfSpeech は "noun" | "verb" | ... のような列挙型。

// ===========================
// 日本語 → 英語変換表
// ===========================
// 日本語の品詞名を、内部で使う英語の正式表記（列挙）に変換するマッピング。
// 例: 「名詞」→ "noun"、「形容動詞」→ "adjectival_noun"
const JP: Record<string, PartOfSpeech> = {
    名詞:'noun', 動詞:'verb', 形容詞:'adjective', 形容動詞:'adjectival_noun',
    副詞:'adverb', 代名詞:'pronoun', 前置詞:'preposition', 接続詞:'conjunction',
    感嘆詞:'interjection', 助詞:'particle', 助動詞:'auxiliary', 冠詞:'article',
};

// ===========================
// 🇬🇧 英語（略記や表記ゆれ）→ 英語正式表記
// ===========================
// 「n.」「v」「adj」「adjectival noun」などの略語・揺れをすべて正規化する。
// 例: "adj." → "adjective"、"adv" → "adverb"
const EN: Record<string, PartOfSpeech> = {
    n:'noun','n.':'noun',noun:'noun', v:'verb','v.':'verb',verb:'verb',
    adj:'adjective','adj.':'adjective',adjective:'adjective',
    adv:'adverb','adv.':'adverb',adverb:'adverb',
    'adj-n':'adjectival_noun','adjectival noun':'adjectival_noun',
    pron:'pronoun',pronoun:'pronoun',
    prep:'preposition',preposition:'preposition',
    conj:'conjunction',conjunction:'conjunction',
    interj:'interjection',interjection:'interjection',
    part:'particle',particle:'particle',
    aux:'auxiliary',auxiliary:'auxiliary',
    art:'article',article:'article',
};

// ===========================
// 🧩 normalizePOS()
// ===========================
// どんな入力（日本語・英語・配列・略語・混在）でも、
// 最終的に ["noun","verb",...] の形式に統一して返す関数。
export function normalizePOS(input: string | string[] | PartOfSpeech[]): PartOfSpeech[] {

    // 入力が配列だった場合は一旦スペースで結合して文字列化
    // 例: ["名詞","動詞"] → "名詞 動詞"
    const raw = Array.isArray(input) ? input.join(' ') : (input ?? '');

    // 1️⃣ 日本語がくっついている場合（例:「名詞動詞」）をスペースで区切る
    // 2️⃣ カンマ・空白・スラッシュなどもすべて区切りとして分割
    // 3️⃣ 各要素を小文字化＆末尾のドット・s を削除
    // 4️⃣ 空文字は除外
    const tokens = raw
        .replace(/(名詞|動詞|形容詞|形容動詞|副詞|代名詞|前置詞|接続詞|感嘆詞|助詞|助動詞|冠詞)/g, ' $1 ')
        .split(/[,\s/／・|]+/)
        .map(t => t.trim().toLowerCase().replace(/[.:]/g,'').replace(/s$/,''))
        .filter(Boolean);

    // 重複排除のために Set を使用（同じ品詞が2回出ても1回にまとめる）
    const set = new Set<PartOfSpeech>();

    // 1要素ずつ判定して、英語の正式表記に変換
    for (const t of tokens) {
        // 日本語に該当 → JPマップを使う
        if (JP[t as keyof typeof JP]) set.add(JP[t as keyof typeof JP]);
        // 英語・略記に該当 → ENマップを使う
        else if (EN[t as keyof typeof EN]) set.add(EN[t as keyof typeof EN]);
        // 特殊ケース（adj-n など）を直接判定
        else if (['adj-n','adj_n'].includes(t)) set.add('adjectival_noun');
    }

    // Setを配列に変換して返す
    // 例: ["名詞","動詞"] → ["noun","verb"]
    return [...set];
}

// ===========================
// 🈂️ 表示用ラベル（英語→日本語）
// ===========================
// UIでバッジなどに表示するためのマップ。
// 内部値（"noun"など）を日本語で出す。
export const POS_LABEL_JA: Record<PartOfSpeech,string> = {
    noun:'名詞', verb:'動詞', adjective:'形容詞', adverb:'副詞',
    adjectival_noun:'形容動詞', pronoun:'代名詞', preposition:'前置詞',
    conjunction:'接続詞', interjection:'感嘆詞', particle:'助詞',
    auxiliary:'助動詞', article:'冠詞',
};
