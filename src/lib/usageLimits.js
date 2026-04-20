const SETTINGS_KEY = 'holostem_usage_settings'
const STATE_KEY_PREFIX = 'holostem_usage_state_'

const defaultSettings = {
  onboarded: false,
  dailyLimitMinutes: 60,
  nudgeStyle: 'balanced',
  extensionMinutes: 10,
}

function getDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

export function readUsageSettings() {
  if (typeof window === 'undefined') return defaultSettings
  try {
    return { ...defaultSettings, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY)) ?? {}) }
  } catch {
    return defaultSettings
  }
}

export function saveUsageSettings(settings) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...readUsageSettings(), ...settings }))
}

export function readUsageState(dayKey = getDayKey()) {
  if (typeof window === 'undefined') {
    return {
      minutesUsed: 0,
      extraMinutes: 0,
      prompt80Shown: false,
      limitPromptShown: false,
    }
  }

  try {
    return {
      minutesUsed: 0,
      extraMinutes: 0,
      prompt80Shown: false,
      limitPromptShown: false,
      ...(JSON.parse(localStorage.getItem(`${STATE_KEY_PREFIX}${dayKey}`)) ?? {}),
    }
  } catch {
    return {
      minutesUsed: 0,
      extraMinutes: 0,
      prompt80Shown: false,
      limitPromptShown: false,
    }
  }
}

export function saveUsageState(state, dayKey = getDayKey()) {
  if (typeof window === 'undefined') return
  localStorage.setItem(`${STATE_KEY_PREFIX}${dayKey}`, JSON.stringify(state))
}

export function addUsageSeconds(seconds, dayKey = getDayKey()) {
  const current = readUsageState(dayKey)
  const next = {
    ...current,
    minutesUsed: Number((current.minutesUsed + (seconds / 60)).toFixed(2)),
  }
  saveUsageState(next, dayKey)
  return next
}

export function addExtension(minutes, dayKey = getDayKey()) {
  const current = readUsageState(dayKey)
  const next = {
    ...current,
    extraMinutes: current.extraMinutes + minutes,
    limitPromptShown: false,
  }
  saveUsageState(next, dayKey)
  return next
}

export function acknowledge80(dayKey = getDayKey()) {
  const current = readUsageState(dayKey)
  const next = { ...current, prompt80Shown: true }
  saveUsageState(next, dayKey)
  return next
}

export function acknowledgeLimit(dayKey = getDayKey()) {
  const current = readUsageState(dayKey)
  const next = { ...current, limitPromptShown: true }
  saveUsageState(next, dayKey)
  return next
}

export function getDayString() {
  return getDayKey()
}
