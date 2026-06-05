import type { Meta, StoryObj } from '@storybook/react'
import EntryCard from '../app/components/EntryCard'

const meta: Meta<typeof EntryCard> = {
  title: 'Components/EntryCard',
  component: EntryCard,
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof EntryCard>

const defaultProps = {
  headword: 'persist',
  pronunciation: {
    phoneticSpelling: 'pəˈsɪst',
  },
  etymology: 'From Latin persistere, from per- "through" + sistere "to stand".',
  etymologyData: null,
  localizedEtymologyJa: null,
  senses: {
    verb: [
      {
        senseId: 'sense-1',
        meaning: 'continue firmly or obstinately in an opinion or course of action in spite of difficulty.',
        example: 'She persisted in her efforts despite many setbacks.',
        exampleTranslation: '多くの挫折にもかかわらず、彼女は努力を続けた。',
      },
      {
        senseId: 'sense-2',
        meaning: 'continue to exist; be prolonged.',
        example: 'The heavy rain persisted throughout the day.',
        exampleTranslation: '大雨は一日中続いた。',
      },
    ],
  },
  lexicalUnits: [],
  inflections: ['persisted', 'persisting', 'persists'],
  synonyms: ['continue', 'persevere', 'endure'],
  derivatives: ['persistence', 'persistent', 'persistently'],
  antonyms: ['give up', 'quit'],
  grammarTags: {},
  isBookmarked: false,
  onSave: () => {},
  pinnedSenseId: null,
  onTogglePin: () => {},
  displayLocale: 'en' as const,
  compact: false,
  noCard: false,
}

export const Default: Story = {
  args: defaultProps,
}

export const Bookmarked: Story = {
  args: {
    ...defaultProps,
    isBookmarked: true,
  },
}

export const Japanese: Story = {
  args: {
    ...defaultProps,
    displayLocale: 'ja' as const,
  },
}

export const Compact: Story = {
  args: {
    ...defaultProps,
    compact: true,
  },
}
