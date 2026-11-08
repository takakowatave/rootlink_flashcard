import type { DisplayLocale } from '@/types/DisplayLocale'

export type RootDef = {
  root: string
  gloss: string
  glossEn: string
  words: [string, string, string]
}
export type DemoWord = { word: string; roots: [RootDef, RootDef] }

export const DEMO: DemoWord[] = [
  {
    word: 'perturb',
    roots: [
      { root: 'per',   gloss: '完全に', glossEn: 'thoroughly', words: ['perturbation', 'perceive',  'perfect']   },
      { root: 'turb',  gloss: '乱れる', glossEn: 'disturb',    words: ['turbulent',   'turbine',   'turbid']     },
    ],
  },
  {
    word: 'inspect',
    roots: [
      { root: 'in',   gloss: '中に', glossEn: 'into', words: ['include',   'invite',    'inspire']   },
      { root: 'spec', gloss: '見る', glossEn: 'look', words: ['spectacle', 'special',   'species']   },
    ],
  },
  {
    word: 'transport',
    roots: [
      { root: 'trans', gloss: '越えて', glossEn: 'across', words: ['transfer',  'translate', 'transform'] },
      { root: 'port',  gloss: '運ぶ',   glossEn: 'carry',  words: ['portable',  'import',    'export']    },
    ],
  },
  {
    word: 'describe',
    roots: [
      { root: 'de',    gloss: '離れて', glossEn: 'down',  words: ['decide',    'deliver',   'define']    },
      { root: 'scrib', gloss: '書く',   glossEn: 'write', words: ['subscribe', 'inscribe',  'scribble']  },
    ],
  },
  {
    word: 'construct',
    roots: [
      { root: 'con',    gloss: '共に',   glossEn: 'together', words: ['connect',   'conclude',  'confirm']   },
      { root: 'struct', gloss: '建てる', glossEn: 'build',    words: ['structure', 'instruct',  'obstruct']  },
    ],
  },
  {
    word: 'compress',
    roots: [
      { root: 'com',   gloss: '共に', glossEn: 'together', words: ['combine',  'compare',   'compete']   },
      { root: 'press', gloss: '押す', glossEn: 'push',     words: ['pressure', 'impress',   'express']   },
    ],
  },
]

export function glossFor(root: RootDef, locale: DisplayLocale): string {
  return locale === 'en' ? root.glossEn : root.gloss
}
