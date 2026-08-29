'use client'

import toast from 'react-hot-toast'
import { isNativePlatform } from '@/lib/isNativePlatform'

type Params = {
  cardUrl: string
  filename: string
  shareText: string
  shareUrl: string
}

// Web (Desktop + Mobile browser) は OGP プレビュー方式で統一。
// Native app (Capacitor) のみ card.png を一旦ローカル保存 → OS 共有シート経由で X アプリに画像添付。
// 詳細: Notion「単語カードの画像生成ルート」/ memory feedback_x_share_image_clipboard.md

// 後方互換: 呼び出し側の prefetchShareImage は残すが no-op 化
export function prefetchShareImage(_cardUrl: string) {
  // no-op (旧 clipboard 方式の名残り。Web 経路では blob 事前取得は不要になった)
}

function openXCompose(text: string) {
  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
    '_blank',
    'noopener,noreferrer'
  )
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function shareOnNative({ cardUrl, filename, shareText }: Params) {
  const [{ Share }, { Filesystem, Directory }] = await Promise.all([
    import('@capacitor/share'),
    import('@capacitor/filesystem'),
  ])

  const res = await fetch(cardUrl)
  if (!res.ok) throw new Error(`card fetch failed: ${res.status}`)
  const blob = await res.blob()
  const base64 = await blobToBase64(blob)

  const { uri } = await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Cache,
  })

  await Share.share({
    files: [uri],
    text: shareText,
  })
}

export async function shareViaClipboardAndX(params: Params) {
  if (isNativePlatform()) {
    const loadingId = toast.loading('画像を準備中…')
    try {
      await shareOnNative(params)
      toast.dismiss(loadingId)
    } catch (err) {
      console.error('native share failed:', err)
      toast.dismiss(loadingId)
      const msg = (err as { message?: string })?.message ?? ''
      // ユーザーが共有シートで cancel した場合は toast しない
      if (!/cancel|abort/i.test(msg)) {
        toast.error('共有に失敗しました')
      }
    }
    return
  }

  // Web (Desktop + Mobile browser 全部) = OGP プレビュー方式
  openXCompose(`${params.shareText} ${params.shareUrl}`)
}
