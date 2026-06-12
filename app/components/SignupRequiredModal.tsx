'use client'

import Link from 'next/link'
import Button from '@/components/Button'
import { BsX } from 'react-icons/bs'

type Props = {
  onClose: () => void
}

export default function SignupRequiredModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 text-gray-400"
        >
          <BsX size={24} />
        </button>

        <h2 className="text-lg font-bold text-gray-900 mb-2">アカウント登録が必要です</h2>
        <p className="text-sm text-gray-500 mb-6">
          単語を保存するにはアカウントが必要です。無料で登録できます。
        </p>

        <div className="flex flex-col gap-2">
          <Link href="/signup" className="w-full">
            <Button variant="primary" size="md" fullWidth>新規登録（無料）</Button>
          </Link>
          <Link href="/login" className="w-full">
            <Button variant="secondary" size="md" fullWidth>ログイン</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
