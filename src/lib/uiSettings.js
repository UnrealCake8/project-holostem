const SETTINGS_KEY = 'holostem_ui_settings'

export function readUiSettings() {
  if (typeof window === 'undefined') {
    return {
      largeText: false,
      simpleMode: false,
      darkMode: true,
      bionicReading: false,
      mutedByDefault: true,
    }
  }

  try {
    const defaults = {
      largeText: false,
      simpleMode: false,
      darkMode: true,
      bionicReading: false,
      mutedByDefault: true,
    }
    const stored = JSON.parse(window.localStorage.getItem(SETTINGS_KEY))
    return { ...defaults, ...stored }
  } catch {
    return {
      largeText: false,
      simpleMode: false,
      darkMode: true,
      bionicReading: false,
      mutedByDefault: true,
    }
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
