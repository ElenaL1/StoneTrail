"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { mockAuth } from "@/lib/auth/mock-auth-service"
import type {
  AuthResult,
  LoginInput,
  MockInboxItem,
  PasswordResetRequestResult,
  PasswordResetResult,
  ProfileUpdateInput,
  PublicUser,
  RegisterInput,
  ResendResult,
} from "@/lib/auth/types"

type AuthContextType = {
  isReady: boolean
  isAuthenticated: boolean
  user: PublicUser | null
  inbox: MockInboxItem | null
  register: (input: RegisterInput) => Promise<AuthResult<PublicUser & { demoVerificationPath: string }>>
  login: (input: LoginInput) => Promise<AuthResult>
  logout: () => void
  loginDemo: () => Promise<void>
  updateProfile: (input: ProfileUpdateInput) => Promise<AuthResult>
  resendVerification: () => Promise<AuthResult<ResendResult>>
  changeEmail: (email: string) => Promise<AuthResult<ResendResult>>
  verifyEmail: (token: string) => Promise<AuthResult>
  requestPasswordReset: (email: string) => Promise<AuthResult<PasswordResetRequestResult>>
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<AuthResult<PasswordResetResult>>
  getResendAvailableAt: () => number
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const [user, setUser] = useState<PublicUser | null>(null)
  const [inbox, setInbox] = useState<MockInboxItem | null>(null)

  const refresh = useCallback(() => {
    setUser(mockAuth.getSession())
    setInbox(mockAuth.getInbox())
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await mockAuth.initialize()
      if (cancelled) return
      refresh()
      setIsReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [refresh])

  const register = useCallback(async (input: RegisterInput) => {
    const result = await mockAuth.register(input)
    if (result.ok) {
      refresh()
    }
    return result
  }, [refresh])

  const login = useCallback(async (input: LoginInput) => {
    const result = await mockAuth.login(input)
    if (result.ok) {
      refresh()
    }
    return result
  }, [refresh])

  const logout = useCallback(() => {
    mockAuth.logout()
    refresh()
  }, [refresh])

  const loginDemo = useCallback(async () => {
    await mockAuth.loginDemo()
    refresh()
  }, [refresh])

  const updateProfile = useCallback(async (input: ProfileUpdateInput) => {
    const result = await mockAuth.updateProfile(input)
    if (result.ok) refresh()
    return result
  }, [refresh])

  const resendVerification = useCallback(async () => {
    const result = await mockAuth.resendVerification()
    if (result.ok) refresh()
    return result
  }, [refresh])

  const changeEmail = useCallback(async (email: string) => {
    const result = await mockAuth.changeEmail(email)
    if (result.ok) refresh()
    return result
  }, [refresh])

  const verifyEmail = useCallback(async (token: string) => {
    const result = await mockAuth.verifyEmail(token)
    if (result.ok) refresh()
    return result
  }, [refresh])

  const requestPasswordReset = useCallback(async (email: string) => {
    const result = await mockAuth.requestPasswordReset(email)
    if (result.ok) refresh()
    return result
  }, [refresh])

  const resetPassword = useCallback(async (token: string, password: string, confirmPassword: string) => {
    const result = await mockAuth.resetPassword(token, password, confirmPassword)
    if (result.ok) refresh()
    return result
  }, [refresh])

  const getResendAvailableAt = useCallback(() => {
    if (!user) return 0
    return mockAuth.getResendAvailableAt(user.id)
  }, [user])

  const value = useMemo<AuthContextType>(
    () => ({
      isReady,
      isAuthenticated: Boolean(user),
      user,
      inbox,
      register,
      login,
      logout,
      loginDemo,
      updateProfile,
      resendVerification,
      changeEmail,
      verifyEmail,
      requestPasswordReset,
      resetPassword,
      getResendAvailableAt,
    }),
    [
      isReady,
      user,
      inbox,
      register,
      login,
      logout,
      loginDemo,
      updateProfile,
      resendVerification,
      changeEmail,
      verifyEmail,
      requestPasswordReset,
      resetPassword,
      getResendAvailableAt,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
