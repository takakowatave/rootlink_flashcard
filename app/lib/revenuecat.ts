import { isNativePlatform } from './isNativePlatform'
import { isPreviewNative } from './isPreviewNative'

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

// Paywall 用の商品情報サマリ。native の Purchases.getOfferings() から
// 月額 / 年額それぞれの priceString / price / トライアル有無を吸い出す。
//
// トライアル判定は cross-platform に効かせるため、以下のいずれかで true。
//   - iOS: product.introPrice.price === 0 かつ periodNumberOfUnits > 0
//   - Android: product.subscriptionOptions のどれかに freePhase (price=0) が含まれる
//   - product.defaultOption?.freePhase が存在する
// ストアで無効化すれば自動で false になり、Paywall の文言も切り替わる。
export type PaywallPlanInfo = {
  priceString: string | null
  price: number | null
  currencyCode: string | null
  /** RC SDK が返す「月あたり」の整形済み文字列 (年額プランなら price/12 相当を store 通貨で) */
  pricePerMonthString: string | null
  /** RC SDK が返す「月あたり」の数値 (JPY なら円、USD なら $ など store 通貨) */
  pricePerMonth: number | null
  /** RC SDK が返す「年あたり」の数値 (月額 × 12 相当。年間コスト比較に使う) */
  pricePerYear: number | null
  hasFreeTrial: boolean
}

export type PaywallOfferingSummary = {
  monthly: PaywallPlanInfo
  yearly: PaywallPlanInfo
  /**
   * 現在のストア国コード (ISO 3166 alpha-3 / alpha-2 のどちらか — Store SDK 依存)。
   * JPN のはずなのに priceString が USD 等になっているときは RC / Sandbox の
   * キャッシュ不整合。NativePaywall で JPY フォールバックに落とす判定に使う。
   */
  storefrontCountry: string | null
}

type MaybeProduct = {
  price?: number
  priceString?: string
  currencyCode?: string
  /** RC SDK が用意している「1 か月あたりの整形済み文字列」(iOS / Android 両方) */
  pricePerMonthString?: string | null
  pricePerMonth?: number | null
  pricePerYearString?: string | null
  pricePerYear?: number | null
  introPrice?: { price?: number; periodNumberOfUnits?: number } | null
  subscriptionOptions?: Array<{
    freePhase?: unknown
    pricingPhases?: Array<{ price?: { amountMicros?: number } }>
  }>
  defaultOption?: {
    freePhase?: unknown
    pricingPhases?: Array<{ price?: { amountMicros?: number } }>
  }
}

const emptyPlanInfo = (): PaywallPlanInfo => ({
  priceString: null,
  price: null,
  currencyCode: null,
  pricePerMonthString: null,
  pricePerMonth: null,
  pricePerYear: null,
  hasFreeTrial: false,
})

function readPlanInfo(pkg: { product: MaybeProduct } | undefined | null): PaywallPlanInfo {
  const product = pkg?.product
  if (!product) return emptyPlanInfo()
  const iosTrial =
    product.introPrice?.price === 0 && (product.introPrice?.periodNumberOfUnits ?? 0) > 0
  const androidDefaultTrial = !!product.defaultOption?.freePhase
  const androidAnyOptionTrial = (product.subscriptionOptions ?? []).some(
    (opt) => !!opt.freePhase,
  )
  return {
    priceString: product.priceString ?? null,
    price: typeof product.price === 'number' ? product.price : null,
    currencyCode: product.currencyCode ?? null,
    pricePerMonthString: product.pricePerMonthString ?? null,
    pricePerMonth: typeof product.pricePerMonth === 'number' ? product.pricePerMonth : null,
    pricePerYear: typeof product.pricePerYear === 'number' ? product.pricePerYear : null,
    hasFreeTrial: iosTrial || androidDefaultTrial || androidAnyOptionTrial,
  }
}

async function getStorefrontCountry(): Promise<string | null> {
  if (!isNativePlatform()) return null
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    // 型定義上 getStorefront が存在しない古い SDK バージョンでも落ちないように any 経由。
    const p = Purchases as unknown as { getStorefront?: () => Promise<{ countryCode?: string }> }
    if (typeof p.getStorefront !== 'function') return null
    const sf = await p.getStorefront()
    return sf?.countryCode ?? null
  } catch {
    return null
  }
}

export async function getPaywallOffering(): Promise<PaywallOfferingSummary | null> {
  const offering = await getCurrentOffering()
  if (offering) {
    const [storefrontCountry] = await Promise.all([getStorefrontCountry()])
    return {
      monthly: readPlanInfo(offering.monthly as unknown as { product: MaybeProduct } | null),
      yearly: readPlanInfo(offering.annual as unknown as { product: MaybeProduct } | null),
      storefrontCountry,
    }
  }
  // Web プレビュー (?preview=native) では実 offering が取れないので、
  // レイアウトを確認できるように mock を返す。本番 Web では null を返す。
  if (isPreviewNative()) {
    return {
      monthly: {
        priceString: '¥500',
        price: 500,
        currencyCode: 'JPY',
        pricePerMonthString: '¥500',
        pricePerMonth: 500,
        pricePerYear: 6000,
        hasFreeTrial: true,
      },
      yearly: {
        priceString: '¥4,800',
        price: 4800,
        currencyCode: 'JPY',
        pricePerMonthString: '¥400',
        pricePerMonth: 400,
        pricePerYear: 4800,
        hasFreeTrial: false,
      },
      storefrontCountry: 'JPN',
    }
  }
  return null
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

export type RestoreResult =
  | { ok: true; hasActiveEntitlement: boolean }
  | { ok: false; error: string }

// 復元後の customerInfo を確認し、有効な entitlement があるかを返す。
// 呼び出し側は hasActiveEntitlement=true のときだけ「復元しました」と
// プレミアム反映を行い、false なら「復元できる購入が見つかりませんでした」を出す。
export async function restoreNativePurchases(): Promise<RestoreResult> {
  if (!isNativePlatform()) return { ok: false, error: 'not_native' }
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    const { customerInfo } = await Purchases.restorePurchases()
    const active = customerInfo?.entitlements?.active ?? {}
    return { ok: true, hasActiveEntitlement: Object.keys(active).length > 0 }
  } catch (err) {
    const e = err as { message?: string }
    return { ok: false, error: e?.message ?? 'restore_failed' }
  }
}

// 過去に購入履歴（期限切れ含む）があるかどうか。Paywall で「購入を復元」を
// 表示するかの判定に使う。全ユーザーに出しっぱなしにするとタップして
// 「見つかりませんでした」が頻発するので、履歴があるユーザーだけに絞る。
export async function hasAnyPurchaseHistory(): Promise<boolean> {
  if (!isNativePlatform()) return false
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    const { customerInfo } = await Purchases.getCustomerInfo()
    const active = customerInfo?.entitlements?.active ?? {}
    const all = customerInfo?.entitlements?.all ?? {}
    const products = customerInfo?.allPurchasedProductIdentifiers ?? []
    return (
      Object.keys(active).length > 0 ||
      Object.keys(all).length > 0 ||
      products.length > 0
    )
  } catch {
    return false
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
