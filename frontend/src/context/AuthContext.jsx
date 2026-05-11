import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const activeUserId = useRef(null)

  const fetchProfile = async (authUser) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    // Abort if auth state changed (e.g. signed out) while this query was in flight
    if (activeUserId.current !== authUser.id) return

    setUser(profile ? { ...profile, email: authUser.email, id: authUser.id } : { id: authUser.id, email: authUser.email, name: authUser.email.split('@')[0] })
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      activeUserId.current = session?.user?.id ?? null
      if (session?.user) fetchProfile(session.user).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      activeUserId.current = session?.user?.id ?? null
      if (session?.user) fetchProfile(session.user)
      else setUser(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signup = async ({ email, password, name, university, grad_year, major }) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        name,
        university,
        grad_year: Number(grad_year),
        major,
        email_verified: false,
      })
      if (profileError) console.error('Profile insert failed:', profileError.message)

      await fetch('/api/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.user.id, email, name }),
      })

      await supabase.auth.signOut()
    }
    return data
  }

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email_verified')
      .eq('id', data.user.id)
      .single()

    // Only block if we can confirm email_verified is explicitly false.
    // If the column doesn't exist, profile is null, or there's a DB error — allow login.
    if (!profileError && profile?.email_verified === false) {
      activeUserId.current = null
      await supabase.auth.signOut()
      const err = new Error('Please verify your email before logging in.')
      err.code = 'EMAIL_NOT_VERIFIED'
      err.userId = data.user.id
      throw err
    }

    return data
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const updateUser = async (updates) => {
    if (!user) return
    const { data } = await supabase.from('profiles').update(updates).eq('id', user.id).select().single()
    if (data) setUser(prev => ({ ...prev, ...data }))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
