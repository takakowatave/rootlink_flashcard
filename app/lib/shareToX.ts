import toast from 'react-hot-toast'

type Params = {
  cardUrl: string
  filename: string
  shareText: string
}

// ShareMenu が開いたタイミングで parent が呼ぶ。
// blob を事前に fetch しておくことで、X click 時に同期的に clipboard.write できる。
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

async function downloadFallback(cardUrl: string, filename: string) {
  try {
    const blob: Blob = cachedBlob ?? (await fetch(cardUrl).then((r) => r.blob()))
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
 *
 * 制約:
 * - popup blocker 対策: window.open は user gesture の同期タイミングで呼ぶ必要がある
 * - Safari の clipboard.write は user gesture の同期タイミングで dispatch する必要がある
 * - clipboard.write の非同期 commit は Document が focus を失うと silent fail する
 *
 * 解決策:
 * ShareMenu が開いた瞬間に prefetchShareImage で blob を fetch しておき、
 * ここでは resolved blob を直接 ClipboardItem に渡す (Promise<Blob> ではなく Blob)。
 * これで clipboard.write は同期にコミットされ、直後に window.open しても focus 遷移前に書き込みが完了する。
 * blob 未達なら Promise<Blob> pattern にフォールバック、それでも失敗すれば download フォールバック。
 */
export function shareViaClipboardAndX({ cardUrl, filename, shareText }: Params) {
  const composeUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`

  let writePromise: Promise<void> | null = null
  try {
    if (cachedBlob && cachedUrl === cardUrl) {
      // Best path: 解決済み blob で同期 write
      const item = new ClipboardItem({ 'image/png': cachedBlob })
      writePromise = navigator.clipboard.write([item])
    } else {
      // Fallback: Promise<Blob> pattern (Safari safe だが focus 遷移で失敗しうる)
      const blobPromise = cachedPromise && cachedUrl === cardUrl
        ? cachedPromise
        : fetch(cardUrl).then((res) => {
            if (!res.ok) throw new Error(`fetch failed: ${res.status}`)
            return res.blob()
          })
      const item = new ClipboardItem({ 'image/png': blobPromise })
      writePromise = navigator.clipboard.write([item])
    }
  } catch (err) {
    console.error('clipboard write init failed:', err)
  }

  window.open(composeUrl, '_blank', 'noopener,noreferrer')

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
