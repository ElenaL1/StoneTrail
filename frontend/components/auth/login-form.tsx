"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { fieldControlClassName, FormField } from "@/components/auth/form-field"
import { PasswordInput } from "@/components/auth/password-input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { getSafeNext, registerPath } from "@/lib/auth/paths"
import { AUTH_MESSAGES } from "@/lib/auth/constants"
import { validateEmailValue } from "@/lib/auth/validation"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const next = searchParams.get("next")

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const emailError = validateEmailValue(email)
    const nextErrors: Record<string, string> = {}
    if (emailError) nextErrors.email = emailError
    if (!password) nextErrors.password = AUTH_MESSAGES.passwordRequired
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    const result = await login({ email, password })
    setSubmitting(false)

    if (!result.ok) {
      setErrors(result.code === "validation" ? result.fieldErrors ?? {} : {})
      setFormError(result.message)
      return
    }

    if (!result.data.emailVerified) {
      router.push("/verify-email")
      return
    }

    router.push(getSafeNext(next))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <FormField id="email" label="Email" error={errors.email} required>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          placeholder="name@company.ru"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          className={fieldControlClassName(errors.email)}
          onChange={(event) => setEmail(event.target.value)}
        />
      </FormField>

      <FormField id="password" label="Пароль" error={errors.password} required>
        <PasswordInput
          id="password"
          name="password"
          value={password}
          placeholder="Введите пароль"
          autoComplete="current-password"
          error={errors.password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </FormField>

      {formError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {formError}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting} className="h-11 w-full">
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Вход…
          </>
        ) : (
          "Войти"
        )}
      </Button>

      <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
        <Link href="/forgot-password" className="font-medium text-primary underline-offset-4 hover:underline">
          Забыли пароль?
        </Link>
        <Link href={registerPath(next)} className="font-medium text-primary underline-offset-4 hover:underline">
          Создать аккаунт
        </Link>
      </div>
    </form>
  )
}
