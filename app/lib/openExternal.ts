'use client'

import { isNativePlatform } from './isNativePlatform'

// アプリで開始した「アプリ外URL」の遷移を、native では
// @capacitor/browser の Browser.open で SafariViewController / Chrome
// Custom Tabs に載せてアプリ内表示する。Web は今までどおり別タブ。
//
// 用途: 外部サービス (お問い合わせフォーム / SNS 共有画面 / 他社ドメイン) を
// アプリのフロー内で完結させたい時に呼ぶ。自ドメインへの遷移や画像共有
// (@capacitor/share) は対象外。
export async function openExternalLink(url: string): Promise<void> {
  if (!isNativePlatform()) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }
  try {
    const { Browser } = await import('@capacitor/browser')
    await Browser.open({ url })
  } catch {
    // plugin unavailable (Web preview 等) — target=_blank にフォールバック
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}
