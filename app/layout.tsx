import './globals.css'
import SearchForm from './component/search-form'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-50">
        <header className="sticky top-0 z-50 border-b bg-white">
          <div className="mx-auto max-w-4xl p-4">
            <SearchForm />
          </div>
        </header>

        {children}
      </body>
    </html>
  )
}
