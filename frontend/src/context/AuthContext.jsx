import { createContext, useContext, useState, useEffect } from 'react'
import supabase from '../lib/supabaseClient'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        localStorage.setItem('access_token', session.access_token)
        setUser(session.user)
      }
      setLoading(false)
    })

    // Listen for auth state changes (tab focus, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        localStorage.setItem('access_token', session.access_token)
        setUser(session.user)
      } else {
        localStorage.removeItem('access_token')
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signup = async (email, password, fullName) => {
    const res = await api.post('/auth/signup', { email, password, full_name: fullName })
    return res.data
  }

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('access_token', res.data.access_token)
    setUser(res.data.user)
    return res.data
  }

  const logout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('access_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
