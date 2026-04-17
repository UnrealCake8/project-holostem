const SETTINGS_KEY = 'holostem_ui_settings'

export function readUiSettings() {
  if (typeof window === 'undefined') {
    return { largeText: false, simpleMode: false, darkMode: true }
  }

  try {
    return JSON.parse(window.localStorage.getItem(SETTINGS_KEY)) ?? {
      largeText: false,
      simpleMode: false,
      darkMode: true,
    }
  } catch {
    return { largeText: false, simpleMode: false, darkMode: true }
  }
}

export function applyUiSettings(settings) {
  document.documentElement.classList.toggle('text-lg', settings.largeText)
  document.documentElement.classList.toggle('simple-mode', settings.simpleMode)
  document.documentElement.classList.toggle('light', !settings.darkMode)
}

export function persistUiSettings(settings) {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
