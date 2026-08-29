import toast from 'react-hot-toast'

type Params = {
  cardUrl: string
  filename: string
  shareText: string
}

async function downloadFallback(cardUrl: string, filename: string) {
  try {
    const res = await fetch(cardUrl)
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    toast.success('画像をダウンロードしました。Xに添付してください')
  } catch (err) {
    console.error('download fallback failed:', err)
    toast.error('画像の準備に失敗しました')
  }
}

/**
 * X 投稿用: 画像を clipboard に write → X compose を開く。
 * ポップアップブロッカー対策: window.open は user gesture の同期タイミングで
 * 呼ぶ必要があるため、clipboard.write を await せず fire-and-forget して、
 * 直後の同期タイミングで window.open を実行する。
 */
export function shareViaClipboardAndX({ cardUrl, filename, shareText }: Params) {
  let writePromise: Promise<void> | null = null
  try {
    const item = new ClipboardItem({
      'image/png': fetch(cardUrl).then((res) => {
        if (!res.ok) throw new Error(`fetch failed: ${res.status}`)
        return res.blob()
      }),
    })
    writePromise = navigator.clipboard.write([item])
  } catch (err) {
    console.error('clipboard write init failed:', err)
  }

  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
    '_blank',
    'noopener,noreferrer'
  )

  if (writePromise) {
    writePromise
      .then(() => {
        toast.success('画像をコピーしました。Xで⌘Vで貼り付けてください')
      })
      .catch((err) => {
        console.error('clipboard write failed:', err)
        void downloadFallback(cardUrl, filename)
      })
  } else {
    void downloadFallback(cardUrl, filename)
  }
}
