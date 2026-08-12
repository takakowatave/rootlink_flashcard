import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rootlink.app',
  appName: 'RootLink',
  webDir: 'out',
  server: {
    url: 'https://www.rootlink.app',
    cleartext: false,
  },
};

export default config;
