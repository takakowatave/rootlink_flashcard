import IdiomPageClient from '@/components/lexicalUnitPageClient'

export default function Page({
    params,
    }: {
    params: { slug: string }
    }) {
    return <IdiomPageClient slug={params.slug} />
}
