"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { fieldControlClassName, FormField } from "@/components/auth/form-field"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { AUTH_MESSAGES } from "@/lib/auth/constants"
import { validateEmailValue } from "@/lib/auth/validation"

export function ForgotPasswordForm() {
  const { requestPasswordReset, inbox } = useAuth()
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)
    const emailError = validateEmailValue(email)
    setError(emailError)
    if (emailError) return

    setSubmitting(true)
    const result = await requestPasswordReset(email)
    setSubmitting(false)

    if (!result.ok) {
      setError(result.fieldErrors?.email)
      setFormError(result.fieldErrors?.email ? null : result.message)
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <p className="text-sm leading-relaxed text-foreground" role="status">
          {AUTH_MESSAGES.resetGeneric}
        </p>
        {inbox?.type === "reset" ? (
          <p className="text-sm text-muted-foreground">
            Пока письма отправляются локально, откройте{" "}
            <Link href={inbox.path} className="font-medium text-primary underline-offset-4 hover:underline">
              ссылку для восстановления
            </Link>
            .
          </p>
        ) : null}
        <Link href="/login" className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline">
          Вернуться ко входу
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <FormField id="email" label="Email" error={error} required>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          placeholder="name@company.ru"
          autoComplete="email"
          aria-invalid={Boolean(error)}
          className={fieldControlClassName(error)}
          onChange={(event) => setEmail(event.target.value)}
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
            Отправка…
          </>
        ) : (
          "Отправить инструкции"
        )}
      </Button>
    </form>
  )
}
