import type { Meta, StoryObj } from '@storybook/react'
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport'
import { MdIosShare, MdClose, MdArrowBackIosNew } from 'react-icons/md'
import { BsArrowUpRightSquare } from 'react-icons/bs'
import ModalShell from '../app/components/ModalShell'

const meta: Meta<typeof ModalShell> = {
  title: 'Components/ModalShell',
  component: ModalShell,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof ModalShell>

const sampleBody = (
  <div className="p-6 space-y-4">
    <p>ここにモーダル本文が入ります。</p>
    {Array.from({ length: 20 }).map((_, i) => (
      <p key={i} className="text-sm text-muted">スクロール確認用のダミー段落 {i + 1}</p>
    ))}
  </div>
)

/** WordDetailModal 風: SP=戻る/PC=拡大 + 共有・閉じる */
export const WordDetailPattern: Story = {
  args: {
    open: true,
    onClose: () => {},
    headerLeft: (
      <>
        <button className="md:hidden p-2 rounded-full text-muted" aria-label="戻る">
          <MdArrowBackIosNew className="size-6" />
        </button>
        <a href="#" className="hidden md:inline-flex p-2 rounded-full text-muted" aria-label="拡大">
          <BsArrowUpRightSquare className="size-5" />
        </a>
      </>
    ),
    headerRight: (
      <>
        <button className="p-2 rounded-full text-muted" aria-label="共有">
          <MdIosShare className="size-6" />
        </button>
        <button className="hidden md:inline-flex p-2 rounded-full text-muted" aria-label="閉じる">
          <MdClose className="size-6" />
        </button>
      </>
    ),
    children: sampleBody,
  },
}

/** EditProfileModal 風: SP=戻る/PC=タイトル + PC=閉じる */
export const SettingsPattern: Story = {
  args: {
    open: true,
    onClose: () => {},
    headerLeft: (
      <>
        <button className="md:hidden p-2 rounded-full text-muted" aria-label="戻る">
          <MdArrowBackIosNew className="size-6" />
        </button>
        <h2 className="hidden md:block text-base font-bold text-gray-950 pl-2">設定</h2>
      </>
    ),
    headerRight: (
      <button className="hidden md:block text-sm text-muted px-2">閉じる</button>
    ),
    children: sampleBody,
  },
}

/** SP 表示 (iPhone6 viewport) */
export const SP: Story = {
  args: {
    open: true,
    onClose: () => {},
    headerLeft: (
      <button className="p-2 rounded-full text-muted" aria-label="戻る">
        <MdArrowBackIosNew className="size-6" />
      </button>
    ),
    headerRight: (
      <button className="p-2 rounded-full text-muted" aria-label="共有">
        <MdIosShare className="size-6" />
      </button>
    ),
    children: sampleBody,
  },
  parameters: {
    viewport: {
      viewports: INITIAL_VIEWPORTS,
      defaultViewport: 'iphone6',
    },
  },
}
