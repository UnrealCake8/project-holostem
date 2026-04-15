const PREFIX = 'holostem'

function key(name) {
  return `${PREFIX}:${name}`
}

export function loadFromStorage(name, fallback) {
  try {
    const raw = localStorage.getItem(key(name))
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function saveToStorage(name, value) {
  localStorage.setItem(key(name), JSON.stringify(value))
}
