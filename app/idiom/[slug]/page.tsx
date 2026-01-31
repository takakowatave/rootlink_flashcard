import IdiomPageClient from '@/components/IdiomPageClient'

export default function Page({
    params,
    }: {
    params: { slug: string }
    }) {
    return <IdiomPageClient slug={params.slug} />
}
