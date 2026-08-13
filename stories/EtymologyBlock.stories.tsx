import type { Meta, StoryObj } from '@storybook/react'
import EtymologyBlock from '../app/components/EtymologyBlock'
import type { EtymologyData } from '../app/types/Etymology'

const meta: Meta<typeof EtymologyBlock> = {
  title: 'Design System/EtymologyBlock',
  component: EtymologyBlock,
  parameters: { layout: 'padded' },
  argTypes: {
    displayLocale: { control: 'radio', options: ['ja', 'en'] },
    withTutorialAttr: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof EtymologyBlock>

const partsEtymology: EtymologyData = {
  originLanguage: { key: 'la', labelEn: 'Latin', labelJa: 'ラテン語' },
  rawEtymology: null,
  wordFamily: [],
  structure: {
    type: 'parts',
    parts: [
      {
        text: 'thes',
        partType: 'root',
        meaning: 'to put, place',
        meaningJa: '置く',
        relatedWords: [],
        order: 0,
      },
      {
        text: 'is',
        partType: 'suffix',
        meaning: 'noun suffix',
        meaningJa: '名詞接尾辞',
        relatedWords: [],
        order: 1,
      },
    ],
    hook: '「置かれたもの」= 立てた命題',
  },
}

const InCardContext = ({ children }: { children: React.ReactNode }) => (
  <div className="max-w-md rounded-xl border border-line bg-white p-4">
    <p className="text-2xl font-bold text-gray-800 mb-2">thesis</p>
    {children}
  </div>
)

export const PartsWithDescription_JA: Story = {
  name: 'Parts + description (JA)',
  render: (args) => (
    <InCardContext>
      <EtymologyBlock {...args} />
    </InCardContext>
  ),
  args: {
    headword: 'thesis',
    etymologyData: partsEtymology,
    localizedEtymologyJa: {
      description: '「置かれたもの」= 提示された命題という意味から派生。',
    },
    etymology: 'Late 16th century: via late Latin from Greek, literally "placing, a proposition."',
    displayLocale: 'ja',
    withTutorialAttr: true,
  },
}

export const PartsWithDescription_EN: Story = {
  name: 'Parts + description (EN)',
  render: (args) => (
    <InCardContext>
      <EtymologyBlock {...args} />
    </InCardContext>
  ),
  args: {
    headword: 'thesis',
    etymologyData: partsEtymology,
    localizedEtymologyJa: null,
    etymology: 'Late 16th century: via late Latin from Greek, literally "placing, a proposition."',
    displayLocale: 'en',
    withTutorialAttr: true,
  },
}

export const DescriptionOnly_JA: Story = {
  name: 'Description only (no parts)',
  render: (args) => (
    <InCardContext>
      <EtymologyBlock {...args} />
    </InCardContext>
  ),
  args: {
    headword: 'chance',
    etymologyData: null,
    localizedEtymologyJa: {
      description: '古フランス語の cheance「落ちること、サイコロの出目」から。ラテン語 cadentia「落下」に由来。',
    },
    etymology: 'From Old French cheance, from Latin cadentia (a falling).',
    displayLocale: 'ja',
    withTutorialAttr: true,
  },
}

export const EmptyRendersNothing: Story = {
  name: 'Empty (should render nothing)',
  render: (args) => (
    <InCardContext>
      <EtymologyBlock {...args} />
    </InCardContext>
  ),
  args: {
    headword: 'nothing',
    etymologyData: null,
    localizedEtymologyJa: null,
    etymology: '',
    displayLocale: 'ja',
  },
}

export const InQuizReveal_NoTutorialAttr: Story = {
  name: 'Inside quiz reveal (withTutorialAttr=false)',
  render: (args) => (
    <div className="max-w-md rounded-xl border border-line bg-white p-4">
      <p className="text-xl font-semibold text-gray-800">論文、命題</p>
      <EtymologyBlock {...args} />
      <div className="mt-3 bg-gray-50 rounded-xl p-3 text-base">
        <p className="text-gray-700 leading-relaxed">She defended her thesis in front of the committee.</p>
        <p className="text-gray-400 mt-1.5 leading-relaxed">彼女は委員会の前で論文を弁護した。</p>
      </div>
    </div>
  ),
  args: {
    headword: 'thesis',
    etymologyData: partsEtymology,
    localizedEtymologyJa: {
      description: '「置かれたもの」= 提示された命題という意味から派生。',
    },
    etymology: '',
    displayLocale: 'ja',
    withTutorialAttr: false,
  },
}
