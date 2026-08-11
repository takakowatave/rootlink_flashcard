import type { Meta, StoryObj } from '@storybook/react'
import QuizStatusHelp from '../app/components/QuizStatusHelp'

const meta: Meta<typeof QuizStatusHelp> = {
  title: 'Design System/QuizStatusHelp',
  component: QuizStatusHelp,
  parameters: { layout: 'centered' },
}
export default meta

type Story = StoryObj<typeof QuizStatusHelp>

export const Default: Story = {}
