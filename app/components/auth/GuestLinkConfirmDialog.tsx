'use client'

import ModalShell from '@/components/ModalShell'
import Button from '@/components/Button'

type Props = {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  loading?: boolean
}

/**
 * ゲスト (匿名) ユーザーがログインしようとしたとき、入力したメール or 選んだ
 * Google / Apple アカウントが既に別ユーザーとして登録されている場合に出す確認モーダル。
 * 「ログインする」でこのアカウントに切り替え、ゲストで保存したデータは破棄される。
 * 文言は kiko 承認済み (2026-10-09)。「購入」は書かない — Apple ID / Google アカウントに
 * 紐づいた購入はログイン後に「購入を復元」で移せるため「引き継がれない」は誤り。
 */
export default function GuestLinkConfirmDialog({ open, onCancel, onConfirm, loading }: Props) {
  return (
    <ModalShell open={open} onClose={onCancel}>
      <div className="px-6 py-6 flex flex-col gap-5">
        <p className="text-base text-gray-950 leading-6">
          このメールアドレス（Google / Apple アカウント）は、すでに登録されています。
          <br />
          このアカウントにログインしますか？
        </p>
        <p className="text-sm text-muted leading-5">
          ゲストで保存した単語と学習記録は、このアカウントには引き継がれません。
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Button variant="primary" fullWidth radius="lg" onClick={onConfirm} disabled={loading}>
            {loading ? 'ログイン中...' : 'ログインする'}
          </Button>
          <Button variant="secondary" fullWidth radius="lg" onClick={onCancel} disabled={loading}>
            キャンセル
          </Button>
        </div>
      </div>
    </ModalShell>
  )
}
