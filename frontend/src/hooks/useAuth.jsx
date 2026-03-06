import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE = 'http://localhost:8000'

const api = axios.create({ baseURL: API_BASE })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.get('/api/auth/me')
        .then(res => setUser(res.data))
        .catch(() => localStorage.clear())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const form = new FormData()
    form.append('username', email)
    form.append('password', password)
    const res = await api.post('/api/auth/login', form)
    localStorage.setItem('token', res.data.access_token)
    const me = await api.get('/api/auth/me')
    setUser(me.data)
    return me.data
  }

  const register = async (data, role) => {
    const endpoint = role === 'doctor' ? '/api/auth/register/doctor' : '/api/auth/register/patient'
    await api.post(endpoint, data)
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
    toast.success('Logged out successfully')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, api }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
export { api }
