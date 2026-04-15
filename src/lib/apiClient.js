import { appConfig } from '../config/appConfig'

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiRequest(path, { method = 'GET', body, token, isFormData = false } = {}) {
  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    method,
    headers: isFormData
      ? { ...authHeaders(token) }
      : {
          'Content-Type': 'application/json',
          ...authHeaders(token),
        },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Request failed')
  }
  return data
}
