import Link from 'next/link'

export type BreadcrumbItem = {
  label: string
  href?: string
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-muted flex items-center gap-1 flex-wrap mb-4">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {item.href ? (
            <Link href={item.href} className="hover:text-primary">{item.label}</Link>
          ) : (
            <span className="text-gray-700">{item.label}</span>
          )}
          {i < items.length - 1 && <span aria-hidden="true">›</span>}
        </span>
      ))}
    </nav>
  )
}
