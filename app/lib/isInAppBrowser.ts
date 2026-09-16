import { isNativePlatform } from './isNativePlatform';

export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  // Capacitor の Android/iOS WebView は Android WebView と UA が被るため、
  // native の場合は「アプリ内ブラウザ」判定から必ず外す
  if (isNativePlatform()) return false;
  const ua = navigator.userAgent;
  // LINE, Instagram, Facebook, Twitter, Google App (GSA), Android WebView (wv)
  return /Line\/|Instagram|FBAN|FBAV|Twitter\/|GSA\/|; wv\)/.test(ua);
}
