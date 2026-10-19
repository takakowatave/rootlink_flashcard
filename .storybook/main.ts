import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';

const config: StorybookConfig = {
  stories: [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-interactions"
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {}
  },
  staticDirs: ["../public"],
  viteFinal: async (config) => {
    // @ エイリアスを app/ に解決
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias as object ?? {}),
      '@': path.resolve(__dirname, '../app'),
      'next/navigation': path.resolve(__dirname, './mocks/next-navigation.ts'),
    };
    // app/ は Vite ルート外のため plugin-react のJSX変換が効かず、
    // esbuild のクラシックランタイム(React必須)になる。自動ランタイムに切替。
    config.esbuild = {
      ...(typeof config.esbuild === 'object' ? config.esbuild : {}),
      jsx: 'automatic',
    };
    // supabase クライアントは相対パスでも読み込まれるため、パス末尾で判定して代替に差し替える
    const supabaseMock = path.resolve(__dirname, './mocks/supabaseClient.ts');
    config.plugins = [
      {
        name: 'mock-supabase-client',
        enforce: 'pre',
        resolveId(source: string) {
          return /(^|\/)supabaseClient(\.ts)?$/.test(source) ? supabaseMock : null;
        },
      },
      ...(config.plugins ?? []),
    ];
    return config;
  },
};

export default config;
