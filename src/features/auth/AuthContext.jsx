import { createContext, useContext, useMemo, useState } from 'react'
import {
  getCurrentSession,
  signIn,
  signOut,
  signUp,
  updateCurrentUserProfile,
} from './authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentSession())

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      signIn: (payload) => {
        const result = signIn(payload)
        if (result.ok) setUser(result.user)
        return result
      },
      signUp: (payload) => {
        const result = signUp(payload)
        if (result.ok) setUser(result.user)
        return result
      },
      signOut: () => {
        signOut()
        setUser(null)
      },
      updateProfile: (payload) => {
        const nextUser = updateCurrentUserProfile(payload)
        if (nextUser) setUser(nextUser)
        return nextUser
      },
    }),
    [user],
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
