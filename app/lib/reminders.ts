// 学習リマインダー（ローカル通知）の設定保存と予約を一元化する。
//
// - オンボーディングと設定画面の両方から呼ぶ。
// - 保存先は localStorage。native WebView と Web で silo は分かれるが、
//   端末単位の通知を予約するローカル設定なのでこれで十分（CLAUDE.md の
//   「ユーザー状態は Supabase」ルールが対象にしている端末横断の
//   状態ではない）。
// - schedule / cancel は @capacitor/local-notifications を使う。
//   Web preview では plugin が存在しないので silently no-op。

const STORAGE_KEY = 'rootlink-reminder-settings'
const SCHEMA_VERSION = 1

export type ReminderSlotKey = 'morning' | 'lunch' | 'night'

export type ReminderSlot = {
  key: ReminderSlotKey
  label: string
  time: string // "HH:MM"
  enabled: boolean
}

export type ReminderSettings = {
  version: number
  // 学習リマインダー全体の ON/OFF。false のときは 3 枠の設定に関わらず予約しない。
  masterEnabled: boolean
  slots: ReminderSlot[]
}

export const DEFAULT_REMINDER_SLOTS: ReminderSlot[] = [
  { key: 'morning', label: '起床時', time: '07:00', enabled: true },
  { key: 'lunch', label: 'お昼休み', time: '12:00', enabled: false },
  { key: 'night', label: '寝る前', time: '20:00', enabled: false },
]

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  version: SCHEMA_VERSION,
  masterEnabled: true,
  slots: DEFAULT_REMINDER_SLOTS,
}

function isValidSlotKey(v: unknown): v is ReminderSlotKey {
  return v === 'morning' || v === 'lunch' || v === 'night'
}

function isValidTime(v: unknown): v is string {
  return typeof v === 'string' && /^\d{2}:\d{2}$/.test(v)
}

function normalizeSlots(raw: unknown): ReminderSlot[] {
  if (!Array.isArray(raw)) return DEFAULT_REMINDER_SLOTS
  const bySkey = new Map<ReminderSlotKey, ReminderSlot>()
  for (const item of raw) {
    if (
      item &&
      typeof item === 'object' &&
      isValidSlotKey((item as { key?: unknown }).key)
    ) {
      const key = (item as { key: ReminderSlotKey }).key
      const template = DEFAULT_REMINDER_SLOTS.find((s) => s.key === key)!
      const time = (item as { time?: unknown }).time
      const enabled = (item as { enabled?: unknown }).enabled
      bySkey.set(key, {
        key,
        label: template.label,
        time: isValidTime(time) ? time : template.time,
        enabled: typeof enabled === 'boolean' ? enabled : template.enabled,
      })
    }
  }
  // 順序と欠落は DEFAULT_REMINDER_SLOTS に揃える
  return DEFAULT_REMINDER_SLOTS.map((t) => bySkey.get(t.key) ?? t)
}

export function loadReminderSettings(): ReminderSettings {
  if (typeof window === 'undefined') return DEFAULT_REMINDER_SETTINGS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_REMINDER_SETTINGS
    const parsed = JSON.parse(raw) as Partial<ReminderSettings>
    return {
      version: SCHEMA_VERSION,
      masterEnabled:
        typeof parsed.masterEnabled === 'boolean' ? parsed.masterEnabled : true,
      slots: normalizeSlots(parsed.slots),
    }
  } catch {
    return DEFAULT_REMINDER_SETTINGS
  }
}

export function saveReminderSettings(settings: ReminderSettings): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...settings, version: SCHEMA_VERSION }),
    )
  } catch {
    // localStorage 使用不可（プライベートブラウズ等）は無視
  }
}

// 予約済みの学習リマインダー通知を全てキャンセルする。
export async function cancelAllReminderNotifications(): Promise<void> {
  try {
    const mod = await import('@capacitor/local-notifications')
    const pending = await mod.LocalNotifications.getPending()
    if (pending.notifications.length > 0) {
      await mod.LocalNotifications.cancel({ notifications: pending.notifications })
    }
  } catch {
    // capacitor plugin unavailable (web preview) — silently skip
  }
}

// 現在の settings を通知予約に反映する（許可されていれば）。
// - 全体 OFF、または有効な枠が 0 件のときは既存の予約を全解除。
// - permission が 'granted' でない場合は予約せず、既存の予約もそのまま
//   （通知許可を戻したときに直ちに動かすため、キャンセルは呼び出し側の
//   masterEnabled=false 経路で行う）。
export async function scheduleReminderNotifications(
  settings: ReminderSettings,
): Promise<void> {
  try {
    const mod = await import('@capacitor/local-notifications')
    const perm = await mod.LocalNotifications.checkPermissions()
    if (perm.display !== 'granted') return
    // 既存予約は必ず一度クリアしてから作り直す
    await cancelAllReminderNotifications()
    if (!settings.masterEnabled) return
    const enabled = settings.slots.filter((s) => s.enabled)
    if (enabled.length === 0) return
    const notifications = enabled.map((slot, index) => {
      const [h, m] = slot.time.split(':').map(Number)
      const at = new Date()
      at.setHours(h ?? 0, m ?? 0, 0, 0)
      if (at.getTime() <= Date.now()) at.setDate(at.getDate() + 1)
      return {
        id: index + 1,
        title: 'RootLink',
        body: '今日の1語を思い出そう',
        schedule: { at, repeats: true, every: 'day' as const },
      }
    })
    await mod.LocalNotifications.schedule({ notifications })
  } catch {
    // capacitor plugin unavailable (web preview) — silently skip
  }
}

// UI から一発で「保存＋予約反映」を呼べるようにするヘルパー。
export async function persistAndApplyReminders(
  settings: ReminderSettings,
): Promise<void> {
  saveReminderSettings(settings)
  if (!settings.masterEnabled) {
    await cancelAllReminderNotifications()
    return
  }
  await scheduleReminderNotifications(settings)
}

// ログアウト・退会時に呼ぶ。予約済みの通知を全てキャンセルし、
// 保存済みの設定 (masterEnabled / slots) も localStorage から消す。
// 別アカウントで再ログインした時に前ユーザーの reminder が発火するのを防ぐ。
export async function clearReminders(): Promise<void> {
  await cancelAllReminderNotifications()
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // localStorage 使用不可（プライベートブラウズ等）は無視
    }
  }
}
