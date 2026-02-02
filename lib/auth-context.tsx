'use client'

import React, { createContext, useContext, useState } from 'react'
import * as api from './api'

export type UserRole = 'owner' | 'staff' | 'customer' | 'super_admin'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  businessId?: string
  businessName?: string
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const USE_API = !!process.env.NEXT_PUBLIC_API_URL

// Mock user data (used when no API configured)
const MOCK_USERS: Record<string, { password: string; user: AuthUser }> = {
  'admin@biashara.com': {
    password: 'password123',
    user: {
      id: 'admin-1',
      name: 'Platform Admin',
      email: 'admin@biashara.com',
      role: 'super_admin',
    },
  },
  'owner@biashara.com': {
    password: 'password123',
    user: {
      id: 'owner-1',
      name: 'Amara Okafor',
      email: 'owner@biashara.com',
      role: 'owner',
      businessId: 'biz-1',
      businessName: "Amara's Artisan Goods",
    },
  },
  'staff@biashara.com': {
    password: 'password123',
    user: {
      id: 'staff-1',
      name: 'Kofi Mensah',
      email: 'staff@biashara.com',
      role: 'staff',
      businessId: 'biz-1',
    },
  },
  'customer@biashara.com': {
    password: 'password123',
    user: {
      id: 'customer-1',
      name: 'Amina Hassan',
      email: 'customer@biashara.com',
      role: 'customer',
    },
  },
}

function toAuthUser(u: api.AuthUser): AuthUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as UserRole,
    businessId: u.businessId,
    businessName: u.businessName,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const persistSession = (authUser: AuthUser, token?: string) => {
    setUser(authUser)
    sessionStorage.setItem('biashara_user', JSON.stringify(authUser))
    if (token) sessionStorage.setItem('biashara_token', token)
  }

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      if (USE_API) {
        const res = await api.login(email, password)
        if (res.requiresTwoFactor) throw new Error('2FA not yet supported in UI')
        persistSession(toAuthUser(res.user), res.token)
      } else {
        await new Promise((r) => setTimeout(r, 500))
        const record = MOCK_USERS[email.toLowerCase()]
        if (!record || record.password !== password) throw new Error('Invalid credentials')
        persistSession(record.user)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      if (USE_API) {
        const res = await api.register({ name, email, password })
        persistSession(toAuthUser(res.user), res.token)
      } else {
        await new Promise((r) => setTimeout(r, 500))
        if (MOCK_USERS[email.toLowerCase()]) throw new Error('Email already registered')
        const newUser: AuthUser = { id: 'cust-new', name, email, role: 'customer' }
        MOCK_USERS[email.toLowerCase()] = { password, user: newUser }
        persistSession(newUser)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem('biashara_user')
    sessionStorage.removeItem('biashara_token')
  }

  React.useEffect(() => {
    const stored = sessionStorage.getItem('biashara_user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to restore user session', e)
      }
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
