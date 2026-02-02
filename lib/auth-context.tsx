'use client'

import React, { createContext, useContext, useState } from 'react'

export type UserRole = 'owner' | 'staff' | 'customer'

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
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock user data
const MOCK_USERS: Record<string, { password: string; user: AuthUser }> = {
  'owner@biashara.com': {
    password: 'password123',
    user: {
      id: 'owner-1',
      name: 'Amara Okafor',
      email: 'owner@biashara.com',
      role: 'owner',
      businessId: 'biz-1',
      businessName: 'Amara\' Artisan Goods',
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const userRecord = MOCK_USERS[email.toLowerCase()]
      if (!userRecord || userRecord.password !== password) {
        throw new Error('Invalid credentials')
      }

      setUser(userRecord.user)
      // Store in sessionStorage for persistence across page refreshes
      sessionStorage.setItem('biashara_user', JSON.stringify(userRecord.user))
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem('biashara_user')
  }

  // Initialize from sessionStorage
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
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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
