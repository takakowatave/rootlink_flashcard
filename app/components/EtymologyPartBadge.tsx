'use client'

import EtymologyPartPill from '@/components/EtymologyPartPill'

type Props = {
  partText: string
  gloss?: string
}

export default function EtymologyPartBadge({ partText, gloss }: Props) {
  return (
    <div className="flex items-center gap-2">
      <EtymologyPartPill partText={partText} />
      {gloss && <span className="text-sm font-medium text-primary">{gloss}</span>}
    </div>
  )
}
