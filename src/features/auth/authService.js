import { apiRequest } from '../../lib/apiClient'
import { loadFromStorage, saveToStorage } from '../../lib/storage'

const SESSION_KEY = 'session'

export function getCurrentSession() {
  return loadFromStorage(SESSION_KEY, null)
}

export function signOut() {
  saveToStorage(SESSION_KEY, null)
}

export async function signUp(payload) {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: payload,
  })
  const session = { token: data.token, user: data.user }
  saveToStorage(SESSION_KEY, session)
  return session
}

export async function signIn(payload) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: payload,
  })
  const session = { token: data.token, user: data.user }
  saveToStorage(SESSION_KEY, session)
  return session
}

export async function refreshMe(token) {
  const data = await apiRequest('/auth/me', { token })
  const session = { token, user: data.user }
  saveToStorage(SESSION_KEY, session)
  return session
}

export async function updateCurrentUserProfile(token, updates) {
  const data = await apiRequest('/users/me/profile', {
    method: 'PATCH',
    body: updates,
    token,
  })

  const current = getCurrentSession()
  const session = { token, user: data.user || current?.user }
  saveToStorage(SESSION_KEY, session)
  return session
}
