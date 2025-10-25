import { create } from 'zustand'
import type { User } from '@/types/auth'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => {
  // Tentar recuperar user do localStorage
  const storedUser = localStorage.getItem('user')
  const initialUser = storedUser ? JSON.parse(storedUser) : null

  return {
    user: initialUser,
    isAuthenticated: !!initialUser,
    setUser: (user) => {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user))
      } else {
        localStorage.removeItem('user')
      }
      set({ user, isAuthenticated: !!user })
    },
    logout: () => {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      set({ user: null, isAuthenticated: false })
    },
  }
})