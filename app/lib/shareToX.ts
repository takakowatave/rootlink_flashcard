import toast from 'react-hot-toast'

type Params = {
  cardUrl: string
  filename: string
  shareText: string
}

/**
 * X 投稿用: 画像を clipboard に write → X compose を開く。
 * URL は付けず、compose 側で画像が添付された状態にする。
 * Safari は user gesture 内で同期的に clipboard.write を発行する必要があるため、
 * ClipboardItem に fetch の Promise<Blob> を渡す。
 */
export async function shareViaClipboardAndX({ cardUrl, filename, shareText }: Params) {
  let copied = false
  try {
    const item = new ClipboardItem({
      'image/png': fetch(cardUrl).then((res) => {
        if (!res.ok) throw new Error(`fetch failed: ${res.status}`)
        return res.blob()
      }),
    })
    await navigator.clipboard.write([item])
    copied = true
  } catch (err) {
    console.error('clipboard write failed:', err)
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
    } catch (err2) {
      console.error('download fallback failed:', err2)
    }
  }
  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
    '_blank',
    'noopener,noreferrer'
  )
  toast.success(
    copied
      ? '画像をコピーしました。Xで⌘Vで貼り付けてください'
      : '画像をダウンロードしました。Xに添付してください'
  )
}
