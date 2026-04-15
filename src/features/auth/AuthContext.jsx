import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  getCurrentSession,
  refreshMe,
  signIn,
  signOut,
  signUp,
  updateCurrentUserProfile,
} from './authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getCurrentSession())
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    async function bootstrap() {
      if (!session?.token) {
        setAuthLoading(false)
        return
      }

      try {
        const next = await refreshMe(session.token)
        setSession(next)
      } catch {
        signOut()
        setSession(null)
      } finally {
        setAuthLoading(false)
      }
    }

    bootstrap()
  }, [])

  const value = useMemo(
    () => ({
      user: session?.user || null,
      token: session?.token || null,
      isAuthenticated: Boolean(session?.token),
      authLoading,
      signIn: async (payload) => {
        const next = await signIn(payload)
        setSession(next)
        return next
      },
      signUp: async (payload) => {
        const next = await signUp(payload)
        setSession(next)
        return next
      },
      signOut: () => {
        signOut()
        setSession(null)
      },
      updateProfile: async (payload) => {
        if (!session?.token) throw new Error('Authentication required')
        const next = await updateCurrentUserProfile(session.token, payload)
        setSession(next)
        return next
      },
    }),
    [session, authLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
