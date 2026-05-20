export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // LINE, Instagram, Facebook, Twitter, Google App (GSA), Android WebView (wv)
  return /Line\/|Instagram|FBAN|FBAV|Twitter\/|GSA\/|; wv\)/.test(ua);
}
