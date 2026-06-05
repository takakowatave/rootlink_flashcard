import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import QuizDashboard from '../app/quiz/QuizDashboard'

/**
 * QuizDashboard fetches mastery stats from Supabase on mount.
 * In Storybook, the Supabase client is uninitialised so the component
 * renders in its loading state.  A real connected environment (or a
 * Supabase mock) is required to see the fully-loaded UI.
 */
const meta: Meta<typeof QuizDashboard> = {
  title: 'Quiz/QuizDashboard',
  component: QuizDashboard,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onStart: fn(),
    onBack: fn(),
  },
}

export default meta
type Story = StoryObj<typeof QuizDashboard>

export const Default: Story = {}
