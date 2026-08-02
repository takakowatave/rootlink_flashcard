'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          background: '#fff',
          color: '#111',
        }}
      >
        <p style={{ fontSize: 56, fontWeight: 700, color: '#00AD82', margin: 0 }}>
          Error
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 16 }}>
          問題が発生しました
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 12 }}>
          時間をおいてもう一度お試しください。
        </p>
        <div
          style={{
            marginTop: 32,
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={() => reset()}
            style={{
              height: 40,
              padding: '0 24px',
              background: '#00AD82',
              color: '#fff',
              border: 'none',
              borderRadius: 9999,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            再試行
          </button>
          <a
            href="/"
            style={{
              height: 40,
              padding: '0 24px',
              background: '#fff',
              color: '#00AD82',
              border: '1px solid #00AD82',
              borderRadius: 9999,
              fontSize: 14,
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
          >
            ホームへ戻る
          </a>
        </div>
      </body>
    </html>
  )
}
