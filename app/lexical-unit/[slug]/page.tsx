import { redirect } from 'next/navigation'
import IdiomPageClient from '@/components/lexicalUnitPageClient'
import { normalizeLexicalUnit } from '@/lib/normalize'

export default async function Page({
  params,
}: {
  params: { slug: string }
}) {
  const rawSlug = decodeURIComponent(params.slug)

  const normalizedSlug = normalizeLexicalUnit(rawSlug)

  if (normalizedSlug !== rawSlug.toLowerCase()) {
    redirect(`/lexical-unit/${normalizedSlug}`)
  }

  return <IdiomPageClient slug={normalizedSlug} />
}
