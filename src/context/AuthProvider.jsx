import { useEffect, useMemo, useState } from 'react'
import { hasSupabaseConfig, supabase } from '../lib/supabase'
import { AuthContext } from './auth-context'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(hasSupabaseConfig)

  useEffect(() => {
    if (!hasSupabaseConfig) return

    let active = true

    supabase.auth.getUser().then(({ data }) => {
      if (active) {
        setUser(data.user ?? null)
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function signUp({ email, password, fullName }) {
    if (!hasSupabaseConfig) throw new Error('Configure Supabase env vars to enable auth.')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
  }

  async function signIn({ email, password }) {
    if (!hasSupabaseConfig) throw new Error('Configure Supabase env vars to enable auth.')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    if (!hasSupabaseConfig) return
    await supabase.auth.signOut()
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      hasSupabaseConfig,
      signUp,
      signIn,
      signOut,
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
