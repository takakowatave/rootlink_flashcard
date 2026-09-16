import { isNativePlatform } from './isNativePlatform'

type NativePlatform = 'ios' | 'android' | null

function getNativePlatform(): NativePlatform {
  if (typeof window === 'undefined') return null
  const cap = (window as { Capacitor?: { getPlatform?: () => string } }).Capacitor
  const platform = typeof cap?.getPlatform === 'function' ? cap.getPlatform() : null
  if (platform === 'ios' || platform === 'android') return platform
  return null
}

function getApiKey(platform: NativePlatform): string | null {
  if (platform === 'ios') return process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY ?? null
  if (platform === 'android') return process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_KEY ?? null
  return null
}

let configuredAppUserID: string | null | undefined = undefined

export async function ensureRevenueCatConfigured(appUserID: string | null): Promise<boolean> {
  if (!isNativePlatform()) return false
  const platform = getNativePlatform()
  const apiKey = getApiKey(platform)
  if (!apiKey) return false

  const { Purchases } = await import('@revenuecat/purchases-capacitor')

  if (configuredAppUserID === undefined) {
    await Purchases.configure({ apiKey, appUserID: appUserID ?? undefined })
    configuredAppUserID = appUserID
    return true
  }

  if (appUserID && appUserID !== configuredAppUserID) {
    await Purchases.logIn({ appUserID })
    configuredAppUserID = appUserID
  }
  return true
}

// ログアウト・退会時に呼ぶ。native のときだけ Purchases.logOut() を叩く。
// 匿名 appUserID の状態で logOut するとエラー（"already anonymous"）になるので
// 握りつぶす。configuredAppUserID もリセットして、次の SIGNED_IN で
// ensureRevenueCatConfigured が新しい appUserID で configure し直せるようにする。
export async function signOutRevenueCat(): Promise<void> {
  if (!isNativePlatform()) return
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    await Purchases.logOut()
  } catch {
    // 匿名 user だったとき等はエラー扱いで無視
  }
  configuredAppUserID = undefined
}

export async function getCurrentOffering() {
  if (!isNativePlatform()) return null
  const { Purchases } = await import('@revenuecat/purchases-capacitor')
  const offerings = await Purchases.getOfferings()
  return offerings.current
}

export type NativePlanKey = 'monthly' | 'yearly'

export async function purchaseNativePlan(plan: NativePlanKey): Promise<{ ok: boolean; cancelled?: boolean; error?: string }> {
  if (!isNativePlatform()) return { ok: false, error: 'not_native' }
  const { Purchases } = await import('@revenuecat/purchases-capacitor')
  const offerings = await Purchases.getOfferings()
  const current = offerings.current
  if (!current) return { ok: false, error: 'no_offering' }
  const aPackage = plan === 'monthly' ? current.monthly : current.annual
  if (!aPackage) return { ok: false, error: 'no_package' }

  try {
    await Purchases.purchasePackage({ aPackage })
    return { ok: true }
  } catch (err) {
    const e = err as { userCancelled?: boolean; message?: string }
    if (e?.userCancelled) return { ok: false, cancelled: true }
    return { ok: false, error: e?.message ?? 'purchase_failed' }
  }
}

export async function restoreNativePurchases(): Promise<{ ok: boolean; error?: string }> {
  if (!isNativePlatform()) return { ok: false, error: 'not_native' }
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    await Purchases.restorePurchases()
    return { ok: true }
  } catch (err) {
    const e = err as { message?: string }
    return { ok: false, error: e?.message ?? 'restore_failed' }
  }
}

export async function openNativeManageSubscriptions(): Promise<{ ok: boolean; error?: string }> {
  if (!isNativePlatform()) return { ok: false, error: 'not_native' }
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    const { customerInfo } = await Purchases.getCustomerInfo()
    // managementURL があれば正確な deep-link (Play Store は package/sku 込み)。
    // 無ければストア共通の subscriptions URL にフォールバック。
    const fallback =
      getNativePlatform() === 'ios'
        ? 'https://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions'
    // Browser.open (SafariViewController / Chrome Custom Tabs) で開く。
    // Universal Link / Play Store intent が発火してストア native アプリのサブスク管理に転送される。
    // Capacitor 7 では @capacitor/app に openUrl がないため、既存 auth flow と同じ Browser を使う。
    const { Browser } = await import('@capacitor/browser')
    await Browser.open({ url: customerInfo?.managementURL ?? fallback })
    return { ok: true }
  } catch (err) {
    const e = err as { message?: string }
    return { ok: false, error: e?.message ?? 'open_failed' }
  }
}
