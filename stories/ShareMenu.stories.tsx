import type { Meta, StoryObj } from '@storybook/react'
import ShareMenu from '../app/components/ShareMenu'

const meta: Meta<typeof ShareMenu> = {
  title: 'Design System/ShareMenu',
  component: ShareMenu,
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    onClose: () => {},
    shareUrl: 'https://www.rootlink.app/word/component',
    shareText: 'component — 語源から学ぶ英単語｜RootLink',
  },
}
export default meta

type Story = StoryObj<typeof ShareMenu>

export const PC: Story = {
  parameters: { viewport: { defaultViewport: 'responsive' } },
}

export const SP: Story = {
  parameters: { viewport: { defaultViewport: 'iphone14' } },
}
