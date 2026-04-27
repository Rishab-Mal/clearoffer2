import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('lantern_token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      api.get('/api/users/me')
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('lantern_token')
          delete api.defaults.headers.common['Authorization']
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password })
    const { access_token, user: userData } = res.data
    localStorage.setItem('lantern_token', access_token)
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    setUser(userData)
    return userData
  }

  const signup = async (formData) => {
    const res = await api.post('/api/auth/signup', formData)
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('lantern_token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }))
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
