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
