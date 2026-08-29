import toast from 'react-hot-toast'

type Params = {
  cardUrl: string
  filename: string
  shareText: string
}

// ShareMenu が開いた瞬間 (share icon click) に parent が呼ぶ。
// blob を先に fetch しておくことで、X click 時に clipboard.write が高速で完了する。
let cachedUrl: string | null = null
let cachedBlob: Blob | null = null
let cachedPromise: Promise<Blob> | null = null

export function prefetchShareImage(cardUrl: string) {
  if (cachedUrl === cardUrl && (cachedBlob || cachedPromise)) return
  cachedUrl = cardUrl
  cachedBlob = null
  cachedPromise = fetch(cardUrl)
    .then((res) => {
      if (!res.ok) throw new Error(`fetch failed: ${res.status}`)
      return res.blob()
    })
    .then((blob) => {
      if (cachedUrl === cardUrl) cachedBlob = blob
      return blob
    })
    .catch((err) => {
      console.error('prefetch share image failed:', err)
      cachedPromise = null
      throw err
    })
}

async function resolveBlob(cardUrl: string): Promise<Blob> {
  if (cachedBlob && cachedUrl === cardUrl) return cachedBlob
  if (cachedPromise && cachedUrl === cardUrl) return cachedPromise
  const res = await fetch(cardUrl)
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`)
  return res.blob()
}

/**
 * X 投稿用: 画像を用意 → clipboard に write → X compose を開く。
 * 準備が終わってから開く。順序を逆にすると focus 遷移で clipboard write が silent fail する。
 * popup blocker で開けない場合は、リンク付きトーストで手動で開いてもらう。
 */
export async function shareViaClipboardAndX({ cardUrl, filename, shareText }: Params) {
  const composeUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`

  let blob: Blob
  try {
    blob = await resolveBlob(cardUrl)
  } catch (err) {
    console.error('fetch failed:', err)
    toast.error('画像の準備に失敗しました')
    return
  }

  let copied = false
  try {
    const item = new ClipboardItem({ 'image/png': blob })
    await navigator.clipboard.write([item])
    copied = true
  } catch (err) {
    console.error('clipboard write failed:', err)
  }

  const popup = window.open(composeUrl, '_blank', 'noopener,noreferrer')

  if (!popup) {
    toast.error(
      copied
        ? '画像はコピー済みです。ポップアップが開けなかったので手動でXを開いてください'
        : 'ポップアップが開けませんでした'
    )
    if (!copied) await downloadFallback(blob, filename)
    return
  }

  if (copied) {
    toast.success('画像をコピーしました。Xで⌘Vで貼り付けてください')
  } else {
    await downloadFallback(blob, filename)
  }
}

async function downloadFallback(blob: Blob, filename: string) {
  try {
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
