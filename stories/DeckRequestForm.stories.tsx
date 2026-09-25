import type { Meta, StoryObj } from '@storybook/react'
import DeckRequestForm from '../app/components/DeckRequestForm'

const meta: Meta<typeof DeckRequestForm> = {
  title: 'Design System/DeckRequestForm',
  component: DeckRequestForm,
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof DeckRequestForm>

export const Default: Story = {}
