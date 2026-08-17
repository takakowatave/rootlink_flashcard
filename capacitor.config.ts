import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rootlink.app',
  appName: 'RootLink',
  webDir: 'out',
  server: {
    url: 'https://www.rootlink.app',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: false,
      backgroundColor: '#ffffff',
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: false,
    },
  },
};

export default config;
