import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rootlink.app',
  appName: 'RootLink',
  webDir: 'out',
  server: {
    // dev の Vercel preview で確認したいときは、cap sync 時に env を渡す:
    //   CAPACITOR_SERVER_URL=https://rootlink-flashcard-git-develop-... npx cap sync ios
    // 未指定なら本番。commit しないので事故が起きない。
    url: process.env.CAPACITOR_SERVER_URL ?? 'https://www.rootlink.app',
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
