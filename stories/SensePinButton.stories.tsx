import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import SensePinButton from '../app/components/SensePinButton'

const meta: Meta<typeof SensePinButton> = {
  title: 'Design System/SensePinButton',
  component: SensePinButton,
  parameters: { layout: 'padded' },
  argTypes: {
    onToggle: { action: 'toggled' },
    displayLocale: { control: 'radio', options: ['ja', 'en'] },
    tutorialAttr: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof SensePinButton>

const InCardContext = ({ isPinned, displayLocale }: { isPinned: boolean; displayLocale: 'ja' | 'en' }) => {
  const [pinned, setPinned] = useState(isPinned)
  return (
    <div className="group flex items-start gap-2 max-w-md rounded-xl border border-line bg-white p-4">
      <div className="flex-1 min-w-0">
        <span className="inline-block text-xs font-semibold text-muted mb-1">1.</span>
        <p className="text-lg text-gray-800 mb-2">
          {displayLocale === 'ja' ? '踏ん張って乗り越える' : 'to continue despite difficulties'}
        </p>
        <p className="text-sm text-muted">
          {displayLocale === 'ja'
            ? '困難な状況を諦めずに続けるという意味。'
            : 'To carry on with something despite the challenges you face.'}
        </p>
      </div>
      <SensePinButton
        isPinned={pinned}
        onToggle={() => setPinned(p => !p)}
        displayLocale={displayLocale}
      />
    </div>
  )
}

export const Unpinned_JA: Story = {
  name: 'Unpinned (ja) — hover to reveal',
  render: () => <InCardContext isPinned={false} displayLocale="ja" />,
}

export const Pinned_JA: Story = {
  name: 'Pinned (ja)',
  render: () => <InCardContext isPinned={true} displayLocale="ja" />,
}

export const Unpinned_EN: Story = {
  name: 'Unpinned (en) — hover to reveal',
  render: () => <InCardContext isPinned={false} displayLocale="en" />,
}

export const Pinned_EN: Story = {
  name: 'Pinned (en)',
  render: () => <InCardContext isPinned={true} displayLocale="en" />,
}
