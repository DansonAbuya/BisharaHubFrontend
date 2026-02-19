'use client'

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import * as api from './api'
import { setAuthCookie, clearAuthCookie } from './actions/auth-cookie'
import { getCurrentUser as getCurrentUserAction } from './actions/user'

export type UserRole = 'owner' | 'staff' | 'customer' | 'super_admin' | 'assistant_admin'

export interface AuthUser {
  id: string
  name: string
  email: string
  /** Phone for WhatsApp chatbot and notifications (e.g. +254712345678). */
  phone?: string | null
  role: UserRole
  businessId?: string
  businessName?: string
}

/** When login or register requires 2FA, we show code step and complete via verifyCode */
export interface PendingTwoFactor {
  email: string
  user: AuthUser
}

interface AuthContextType {
  user: AuthUser | null
  /** True until we've run the initial session restore (sessionStorage / API). Use to avoid redirecting to login before we know if user is logged in. */
  isInitialized: boolean
  isLoading: boolean
  /** Set when backend returns requiresTwoFactor; clear after verifyCode or cancel */
  pendingTwoFactor: PendingTwoFactor | null
  login: (email: string, password: string, options?: { forceUseApi?: boolean }) => Promise<{ requiresTwoFactor: boolean; user?: AuthUser }>
  register: (name: string, email: string, password: string, phone?: string) => Promise<{ requiresTwoFactor: boolean }>
  /** Complete login/register after 2FA code is entered. Returns the authenticated user on success. */
  verifyCode: (email: string, code: string, options?: { forceUseApi?: boolean }) => Promise<AuthUser | null>
  cancelTwoFactor: () => void
  logout: () => void | Promise<void>
  /** Reload current user from API (e.g. after updating profile/phone). */
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const USE_API = !!process.env.NEXT_PUBLIC_API_URL

/** Inactivity timeout in milliseconds (5 minutes). User is logged out after this period of no activity. */
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000

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
    phone: u.phone,
    role: u.role as UserRole,
    businessId: u.businessId,
    businessName: u.businessName,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [pendingTwoFactor, setPendingTwoFactor] = useState<PendingTwoFactor | null>(null)
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persistSession = (authUser: AuthUser, token?: string, refreshToken?: string) => {
    setUser(authUser)
    setPendingTwoFactor(null)
    sessionStorage.setItem('biashara_user', JSON.stringify(authUser))
    if (token) sessionStorage.setItem('biashara_token', token)
    if (refreshToken) sessionStorage.setItem('biashara_refresh_token', refreshToken)
    if (token) setAuthCookie(token, refreshToken).catch(() => {})
  }

  const login = async (email: string, password: string, options?: { forceUseApi?: boolean }): Promise<{ requiresTwoFactor: boolean; user?: AuthUser }> => {
    const useApi = USE_API || options?.forceUseApi === true
    setIsLoading(true)
    setPendingTwoFactor(null)
    try {
      if (useApi) {
        const res = await api.login(email, password)
        if (res.requiresTwoFactor) {
          setPendingTwoFactor({ email, user: toAuthUser(res.user) })
          return { requiresTwoFactor: true }
        }
        const authUser = toAuthUser(res.user)
        persistSession(authUser, res.token, res.refreshToken)
        return { requiresTwoFactor: false, user: authUser }
      }
      await new Promise((r) => setTimeout(r, 500))
      const record = MOCK_USERS[email.toLowerCase()]
      if (!record || record.password !== password) throw new Error('Invalid credentials')
      persistSession(record.user)
      return { requiresTwoFactor: false, user: record.user }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string, phone?: string): Promise<{ requiresTwoFactor: boolean }> => {
    setIsLoading(true)
    setPendingTwoFactor(null)
    try {
      if (USE_API) {
        const res = await api.register({ name, email, password, phone })
        if (res.requiresTwoFactor) {
          setPendingTwoFactor({ email, user: toAuthUser(res.user) })
          return { requiresTwoFactor: true }
        }
        persistSession(toAuthUser(res.user), res.token, res.refreshToken)
        return { requiresTwoFactor: false }
      }
      await new Promise((r) => setTimeout(r, 500))
      if (MOCK_USERS[email.toLowerCase()]) throw new Error('Email already registered')
      const newUser: AuthUser = { id: 'cust-new', name, email, role: 'customer' }
      MOCK_USERS[email.toLowerCase()] = { password, user: newUser }
      persistSession(newUser)
      return { requiresTwoFactor: false }
    } finally {
      setIsLoading(false)
    }
  }

  const verifyCode = async (email: string, code: string, options?: { forceUseApi?: boolean }): Promise<AuthUser | null> => {
    const useApi = USE_API || options?.forceUseApi === true
    if (!useApi) return null
    setIsLoading(true)
    try {
      const res = await api.verifyCode(email, code)
      const authUser = toAuthUser(res.user)
      persistSession(authUser, res.token, res.refreshToken)
      return authUser
    } catch {
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const cancelTwoFactor = () => setPendingTwoFactor(null)

  const logout = useCallback(async () => {
    // Clear local state first so UI updates immediately.
    setUser(null)
    setPendingTwoFactor(null)
    sessionStorage.removeItem('biashara_user')
    sessionStorage.removeItem('biashara_token')
    sessionStorage.removeItem('biashara_refresh_token')
    if (USE_API) {
      api.logout().catch(() => {})
    }
    // Clear cookie with a short timeout so we never hang; then always redirect to home.
    // Use full page navigation so we leave the current page regardless of route/layout.
    const goHome = () => {
      window.location.href = '/'
    }
    try {
      await Promise.race([
        clearAuthCookie(),
        new Promise<void>((r) => setTimeout(r, 1500)),
      ])
    } catch {
      // ignore
    } finally {
      goHome()
    }
  }, [])

  const refreshUser = async () => {
    if (!USE_API) return
    try {
      const fresh = await getCurrentUserAction()
      if (fresh) {
        setUser(toAuthUser(fresh))
        sessionStorage.setItem('biashara_user', JSON.stringify(fresh))
      }
    } catch {
      // ignore
    }
  }

  /** Inactivity timeout: log out user after 5 minutes of no activity. */
  useEffect(() => {
    if (!user || typeof window === 'undefined') return

    let lastActivityAt = 0
    const THROTTLE_MS = 1000 // Only reset timer at most once per second to avoid excessive resets from mousemove

    const resetTimer = () => {
      const now = Date.now()
      if (lastActivityAt > 0 && now - lastActivityAt < THROTTLE_MS) return
      lastActivityAt = now

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
        inactivityTimerRef.current = null
      }
      inactivityTimerRef.current = setTimeout(() => {
        logout() // clears session and redirects to home
      }, INACTIVITY_TIMEOUT_MS)
    }

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
    resetTimer()
    events.forEach((e) => window.addEventListener(e, resetTimer))

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer))
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
        inactivityTimerRef.current = null
      }
    }
  }, [user, logout])

  React.useEffect(() => {
    let cancelled = false
    const init = async () => {
      const stored = sessionStorage.getItem('biashara_user')
      if (USE_API && typeof window !== 'undefined') {
        try {
          const fresh = await getCurrentUserAction()
          if (!cancelled && fresh) setUser(toAuthUser(fresh))
          else if (!cancelled && stored) {
            try {
              setUser(JSON.parse(stored) as AuthUser)
            } catch {
              // ignore
            }
          }
        } catch {
          if (!cancelled && stored) {
            try {
              setUser(JSON.parse(stored) as AuthUser)
            } catch (e) {
              console.error('Failed to restore user session', e)
            }
          }
        }
      } else if (stored) {
        try {
          if (!cancelled) setUser(JSON.parse(stored) as AuthUser)
        } catch (e) {
          console.error('Failed to restore user session', e)
        }
      }
      if (!cancelled) setIsInitialized(true)
    }
    init()
    return () => { cancelled = true }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isInitialized, isLoading, pendingTwoFactor, login, register, verifyCode, cancelTwoFactor, logout, refreshUser }}>
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
