export type RootDef = { root: string; gloss: string; words: [string, string, string] }
export type DemoWord = { word: string; roots: [RootDef, RootDef] }

export const DEMO: DemoWord[] = [
  {
    word: 'perturb',
    roots: [
      { root: 'per',   gloss: '完全に', words: ['perturbation', 'perceive',  'perfect']   },
      { root: 'turb',  gloss: '乱れる', words: ['turbulent',   'turbine',   'turbid']     },
    ],
  },
  {
    word: 'inspect',
    roots: [
      { root: 'in',   gloss: '中に', words: ['include',   'invite',    'inspire']   },
      { root: 'spec', gloss: '見る', words: ['spectacle', 'special',   'species']   },
    ],
  },
  {
    word: 'transport',
    roots: [
      { root: 'trans', gloss: '越えて', words: ['transfer',  'translate', 'transform'] },
      { root: 'port',  gloss: '運ぶ',   words: ['portable',  'import',    'export']    },
    ],
  },
  {
    word: 'describe',
    roots: [
      { root: 'de',    gloss: '離れて', words: ['decide',    'deliver',   'define']    },
      { root: 'scrib', gloss: '書く',   words: ['subscribe', 'inscribe',  'scribble']  },
    ],
  },
  {
    word: 'construct',
    roots: [
      { root: 'con',    gloss: '共に',   words: ['connect',   'conclude',  'confirm']   },
      { root: 'struct', gloss: '建てる', words: ['structure', 'instruct',  'obstruct']  },
    ],
  },
  {
    word: 'compress',
    roots: [
      { root: 'com',   gloss: '共に', words: ['combine',  'compare',   'compete']   },
      { root: 'press', gloss: '押す', words: ['pressure', 'impress',   'express']   },
    ],
  },
]
