// 例文の中で目立たせる語。英語は記事のスラッグ（a-vs-b）から作り、
// 和訳側は記事ごとに対応する日本語を指定する。
const JA_TERMS: Record<string, string[]> = {
  'farther-vs-further': ['もっと遠く', '遠い', '遠く', 'さらに', '追加', '推し進め', 'それ以上'],
  'historic-vs-historical': ['歴史に残る', '歴史的', '歴史', '史実', '由緒'],
  'complement-vs-compliment': ['補', '引き立て', '褒め', '賛辞', '無料', '補色'],
  'economic-vs-economical': ['経済', '節約', '安上がり', '燃費', '採算'],
  'principal-vs-principle': ['主要', '主な', '校長', '元金', '主役', '原則', '原理', '信念'],
  'classic-vs-classical': ['名作', '定番', '典型', '古典', 'クラシック', '上品'],
  'electric-vs-electrical': ['電気', '電動', '電子', '感電', '配線'],
}

function englishVariants(word: string): string[] {
  const base = word.toLowerCase()
  return [base, `${base}s`, `${base}es`, `${base}ed`, `${base}d`, `${base}ing`, `${base}ly`]
}

// 記事スラッグから対象語のリストを返す。長いものから順に並べて部分一致の取りこぼしを防ぐ。
export function getHighlightTerms(slug: string): string[] {
  const pair = slug.split('-vs-')
  const en = pair.length === 2 ? pair.flatMap(englishVariants) : []
  const ja = JA_TERMS[slug] ?? []
  return [...new Set([...en, ...ja])].sort((a, b) => b.length - a.length)
}
