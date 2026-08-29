'use client'

import toast from 'react-hot-toast'

type Params = {
  cardUrl: string
  filename: string
  shareText: string
}

// ShareMenu が開いた瞬間 (share icon click) に parent が呼ぶ。
// blob を先に fetch しておくことで、X click 時のクリップボード書き込みが即完了する。
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
 * X 投稿用: 画像を用意 → clipboard に write(orダウンロード) → 「Xを開く」ボタンをトーストで提示。
 * 2段階にすることで:
 *   1) 「画像が準備できてからXへ」の順序が保証される
 *   2) window.open が popup blocker で潰れない (ユーザーの新しいクリック gesture で開く)
 */
export async function shareViaClipboardAndX({ cardUrl, filename, shareText }: Params) {
  const composeUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`

  const loadingId = toast.loading('画像を準備中…')

  let blob: Blob
  try {
    blob = await resolveBlob(cardUrl)
  } catch (err) {
    console.error('fetch failed:', err)
    toast.dismiss(loadingId)
    toast.error('画像の準備に失敗しました')
    return
  }

  let copied = false
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    copied = true
  } catch (err) {
    console.error('clipboard write failed:', err)
  }

  if (!copied) {
    downloadNow(blob, filename)
  }

  toast.dismiss(loadingId)

  toast(
    (t) => (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-950 whitespace-nowrap">
          {copied ? '画像をコピーしました' : '画像を保存しました'}
        </span>
        <button
          type="button"
          onClick={() => {
            window.open(composeUrl, '_blank', 'noopener,noreferrer')
            toast.dismiss(t.id)
          }}
          className="px-3 py-1.5 rounded-full bg-primary-hover text-white text-sm font-medium whitespace-nowrap"
        >
          Xを開く
        </button>
      </div>
    ),
    { duration: 15000 }
  )
}

function downloadNow(blob: Blob, filename: string) {
  try {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  } catch (err) {
    console.error('download failed:', err)
  }
}
