import { z } from 'zod'
import { loadFromStorage, saveToStorage } from '../../lib/storage'

const USERS_KEY = 'users'
const SESSION_KEY = 'session'

const signupSchema = z.object({
  fullName: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.email('Use a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const loginSchema = z.object({
  email: z.email('Use a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

function getUsers() {
  return loadFromStorage(USERS_KEY, [])
}

function setUsers(users) {
  saveToStorage(USERS_KEY, users)
}

function publicUser(user) {
  const { password, ...safeUser } = user
  return safeUser
}

export function getCurrentSession() {
  return loadFromStorage(SESSION_KEY, null)
}

export function signOut() {
  saveToStorage(SESSION_KEY, null)
}

export function signUp(payload) {
  const parsed = signupSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors }
  }

  const users = getUsers()
  const exists = users.find((user) => user.email === parsed.data.email)
  if (exists) {
    return { ok: false, errors: { email: ['Email already registered'] } }
  }

  const user = {
    id: crypto.randomUUID(),
    ...parsed.data,
    plan: 'free',
    interests: ['movies', 'music', 'games'],
    privacy: 'friends',
    createdAt: new Date().toISOString(),
  }

  const nextUsers = [...users, user]
  setUsers(nextUsers)
  const session = publicUser(user)
  saveToStorage(SESSION_KEY, session)
  return { ok: true, user: session }
}

export function signIn(payload) {
  const parsed = loginSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors }
  }

  const users = getUsers()
  const user = users.find(
    (candidate) =>
      candidate.email === parsed.data.email && candidate.password === parsed.data.password,
  )
  if (!user) {
    return { ok: false, errors: { email: ['Invalid email or password'] } }
  }

  const session = publicUser(user)
  saveToStorage(SESSION_KEY, session)
  return { ok: true, user: session }
}

export function updateCurrentUserProfile(updates) {
  const session = getCurrentSession()
  if (!session) return null

  const users = getUsers()
  const index = users.findIndex((user) => user.id === session.id)
  if (index < 0) return null

  users[index] = { ...users[index], ...updates }
  setUsers(users)

  const nextSession = publicUser(users[index])
  saveToStorage(SESSION_KEY, nextSession)
  return nextSession
}
