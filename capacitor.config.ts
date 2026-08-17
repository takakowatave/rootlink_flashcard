import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rootlink.app',
  appName: 'RootLink',
  webDir: 'out',
  server: {
    // dev 確認中: develop preview を見る。本番配布前に www.rootlink.app に戻す
    url: 'https://rootlink-flashcard-git-develop-kikos-projects-678edb16.vercel.app',
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
