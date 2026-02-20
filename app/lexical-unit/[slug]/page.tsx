import IdiomPageClient from '@/components/lexicalUnitPageClient'

export default async function Page({
  params,
}: {
  params: { slug: string }
}) {
  const rawSlug = decodeURIComponent(params.slug).trim().toLowerCase()
  return <IdiomPageClient slug={rawSlug} />
}
