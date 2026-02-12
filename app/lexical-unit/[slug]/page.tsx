import { redirect } from 'next/navigation'
import IdiomPageClient from '@/components/lexicalUnitPageClient'
import { entryFilter } from '@/lib/entryFilter'

export default async function Page({
    params,
    }: {
    params: { slug: string }
    }) {
    // slug → 表示用文字列
    const rawInput = params.slug.replace(/-/g, ' ')

    // 正規語を決定（typo 吸収込み）
    const result = await entryFilter(rawInput)

    if (!result.ok) {
        // ここは既存のエラーUIに合わせてOK
        return <div>Invalid query</div>
    }

    const normalized = result.normalized
    const normalizedSlug = normalized.replace(/\s+/g, '-')

    // ★ URL が typo のままなら即リダイレクト
    if (params.slug !== normalizedSlug) {
        redirect(`/lexical-unit/${normalizedSlug}`)
    }

    // URL と正規語が一致している場合のみ描画
    return <IdiomPageClient slug={normalizedSlug} />
}
