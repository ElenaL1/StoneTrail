"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { authApi } from "@/lib/auth/api-client"
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
  register: (input: RegisterInput) => Promise<AuthResult<PublicUser & { demoVerificationPath?: string }>>
  login: (input: LoginInput) => Promise<AuthResult>
  logout: () => Promise<void>
  updateProfile: (input: ProfileUpdateInput) => Promise<AuthResult>
  resendVerification: () => Promise<AuthResult<ResendResult>>
  changeEmail: (email: string) => Promise<AuthResult<ResendResult>>
  verifyEmail: (token: string) => Promise<AuthResult>
  requestPasswordReset: (email: string) => Promise<AuthResult<PasswordResetRequestResult>>
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<AuthResult<PasswordResetResult>>
  getResendAvailableAt: () => number
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function toInbox(type: MockInboxItem["type"], email: string, path?: string | null): MockInboxItem | null {
  if (!path) return null
  return { type, email, path, createdAt: new Date().toISOString() }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const [user, setUser] = useState<PublicUser | null>(null)
  const [inbox, setInbox] = useState<MockInboxItem | null>(null)
  const [resendAvailableAt, setResendAvailableAt] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const result = await authApi.me()
      if (cancelled) return
      if (result.ok) {
        setUser(result.data)
      }
      setIsReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const result = await authApi.register(input)
    if (result.ok) {
      setUser(result.data)
      setInbox(toInbox("verify", result.data.email, result.data.demoVerificationPath))
    }
    return result
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    const result = await authApi.login(input)
    if (result.ok) {
      setUser(result.data)
    }
    return result
  }, [])

  const logout = useCallback(async () => {
    setUser(null)
    setInbox(null)
    setResendAvailableAt(0)
    await authApi.logout()
  }, [])

  const updateProfile = useCallback(async (input: ProfileUpdateInput) => {
    const result = await authApi.updateProfile(input)
    if (result.ok) {
      setUser({
        ...result.data,
        avatar: input.avatar ?? result.data.avatar,
      })
    }
    return result
  }, [])

  const resendVerification = useCallback(async () => {
    const result = await authApi.resendVerification()
    if (result.ok) {
      setResendAvailableAt(result.data.resendAvailableAt)
      setInbox((current) => toInbox("verify", current?.email ?? user?.email ?? "", result.data.demoVerificationPath) ?? current)
    }
    return result
  }, [user?.email])

  const changeEmail = useCallback(async (email: string) => {
    const result = await authApi.changeEmail(email)
    if (!result.ok) return result
    setResendAvailableAt(result.data.resendAvailableAt)
    const me = await authApi.me()
    if (me.ok) {
      setUser(me.data)
    }
    const nextEmail = me.ok && me.data ? me.data.email : email
    setInbox(toInbox("verify", nextEmail, result.data.demoVerificationPath))
    return result
  }, [])

  const verifyEmail = useCallback(async (token: string) => {
    const result = await authApi.verifyEmail(token)
    if (result.ok) {
      setUser(result.data)
      setInbox((current) => (current?.type === "verify" ? null : current))
    }
    return result
  }, [])

  const requestPasswordReset = useCallback(async (email: string) => {
    const result = await authApi.requestPasswordReset(email)
    if (result.ok) {
      setInbox(toInbox("reset", email, result.data.demoResetPath))
    }
    return result
  }, [])

  const resetPassword = useCallback(async (token: string, password: string, confirmPassword: string) => {
    const result = await authApi.resetPassword(token, password, confirmPassword)
    if (result.ok) {
      setUser(null)
      setInbox((current) => (current?.type === "reset" ? null : current))
    }
    return result
  }, [])

  const getResendAvailableAt = useCallback(() => resendAvailableAt, [resendAvailableAt])

  const value = useMemo<AuthContextType>(
    () => ({
      isReady,
      isAuthenticated: Boolean(user),
      user,
      inbox,
      register,
      login,
      logout,
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
