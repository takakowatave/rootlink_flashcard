import type { Meta, StoryObj } from '@storybook/react'
import { useRef, useState } from 'react'
import SearchModal from '../app/components/SearchModal'

const meta: Meta<typeof SearchModal> = {
  title: 'Dialogs/SearchModal',
  component: SearchModal,
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile1' },
  },
}
export default meta

type Story = StoryObj<typeof SearchModal>

function Interactive({ initialOpen = true }: { initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen)
  const [input, setInput] = useState('')
  const formRef = useRef<HTMLFormElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  return (
    <SearchModal
      isOpen={open}
      onClose={() => setOpen(false)}
      input={input}
      onInputChange={(e) => setInput(e.target.value)}
      onSearch={() => {}}
      isLoading={false}
      formRef={formRef}
      inputRef={inputRef}
    />
  )
}

export const OpenMobile: Story = {
  name: 'Open (SP bottom-sheet)',
  render: () => <Interactive />,
}

export const Closed: Story = {
  name: 'Closed (null render)',
  render: () => <Interactive initialOpen={false} />,
}
