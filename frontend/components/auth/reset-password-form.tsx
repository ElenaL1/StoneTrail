"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { FormField } from "@/components/auth/form-field"
import { PasswordInput } from "@/components/auth/password-input"
import { PasswordStrengthMeter } from "@/components/auth/password-strength"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { AUTH_MESSAGES } from "@/lib/auth/constants"
import { validatePassword, validatePasswordConfirmation } from "@/lib/auth/validation"

export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const { resetPassword } = useAuth()
  const token = searchParams.get("token") ?? ""
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [formError, setFormError] = useState<string | null>(token ? null : AUTH_MESSAGES.resetExpired)
  const [completed, setCompleted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!token) {
      setFormError(AUTH_MESSAGES.resetExpired)
      return
    }

    const passwordError = validatePassword(password)
    const confirmError = validatePasswordConfirmation(password, confirmPassword)
    const nextErrors: Record<string, string> = {}
    if (passwordError) nextErrors.password = passwordError
    if (confirmError) nextErrors.confirmPassword = confirmError
    setErrors(nextErrors)
    setFormError(null)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    const result = await resetPassword(token, password, confirmPassword)
    setSubmitting(false)

    if (!result.ok) {
      setErrors(result.fieldErrors ?? {})
      setFormError(result.fieldErrors ? null : result.message)
      return
    }

    setCompleted(true)
  }

  if (completed) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Пароль изменён</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">Теперь вы можете войти в свой аккаунт.</p>
        </div>
        <Button asChild className="h-11 w-full">
          <Link href="/login">Войти</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 space-y-3">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Восстановление пароля</h1>
      </div>
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <FormField id="password" label="Новый пароль" error={errors.password} required>
        <PasswordInput
          id="password"
          name="password"
          value={password}
          placeholder="Введите пароль"
          autoComplete="new-password"
          error={errors.password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </FormField>
      <PasswordStrengthMeter password={password} />

      <FormField id="confirmPassword" label="Подтверждение пароля" error={errors.confirmPassword} required>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          value={confirmPassword}
          placeholder="Повторите пароль"
          autoComplete="new-password"
          error={errors.confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </FormField>

      {formError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {formError}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting || !token} className="h-11 w-full">
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Сохранение…
          </>
        ) : (
          "Сохранить новый пароль"
        )}
      </Button>

      {!token || formError ? (
        <Link href="/forgot-password" className="block text-center text-sm font-medium text-primary underline-offset-4 hover:underline">
          Запросить новую ссылку
        </Link>
      ) : null}
    </form>
    </div>
  )
}
