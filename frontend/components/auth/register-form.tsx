"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { EmailTakenError } from "@/components/auth/email-taken-error"
import { fieldControlClassName, FormField } from "@/components/auth/form-field"
import { PasswordInput } from "@/components/auth/password-input"
import { PasswordStrengthMeter } from "@/components/auth/password-strength"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { generatePassword, offerStorePassword } from "@/lib/auth/password"
import { validateEmailValue, validatePassword, validatePersonName, validateRegisterInput } from "@/lib/auth/validation"
import { cn } from "@/lib/utils"

const initialValues = {
  nickname: "",
  email: "",
  password: "",
  termsAccepted: false,
  marketingConsent: false,
}

type RegisterFormProps = {
  next?: string | null
  autoFocus?: boolean
  onSignIn?: () => void
}

export function RegisterFormFromQuery() {
  const searchParams = useSearchParams()
  return <RegisterForm next={searchParams.get("next")} />
}

export function RegisterForm({ next = null, autoFocus = false, onSignIn }: RegisterFormProps) {
  const router = useRouter()
  const { register } = useAuth()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [emailTaken, setEmailTaken] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)

  const setField = (field: keyof typeof initialValues, value: string | boolean) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const showFieldError = (field: string, message?: string) => {
    setErrors((current) => {
      const nextErrors = { ...current }
      if (message) nextErrors[field] = message
      else delete nextErrors[field]
      return nextErrors
    })
  }

  const handleGeneratePassword = () => {
    setField("password", generatePassword())
    setPasswordVisible(true)
    showFieldError("password")
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)
    setEmailTaken(false)

    const fieldErrors = validateRegisterInput(values)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

    setSubmitting(true)
    const result = await register(values)
    setSubmitting(false)

    if (!result.ok) {
      setErrors(result.fieldErrors ?? {})
      setEmailTaken(result.code === "email_taken")
      setFormError(result.code === "email_taken" ? null : result.message)
      return
    }

    await offerStorePassword({
      email: values.email,
      password: values.password,
      nickname: values.nickname,
    })
    router.push("/verify-email")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <section className="space-y-4">
        <FormField
          id="nickname"
          label="Ник на сайте"
          hint="Так вас будут видеть участники сообщества."
          error={errors.nickname}
          required
        >
          <input
            id="nickname"
            name="nickname"
            value={values.nickname}
            placeholder="Ваше имя"
            autoComplete="nickname"
            autoFocus={autoFocus}
            aria-invalid={Boolean(errors.nickname)}
            className={fieldControlClassName(errors.nickname)}
            onChange={(event) => setField("nickname", event.target.value)}
            onBlur={() => showFieldError("nickname", validatePersonName(values.nickname, "nickname"))}
          />
        </FormField>

        <FormField id="email" label="Email" error={emailTaken ? undefined : errors.email} required>
          <input
            id="email"
            name="email"
            type="email"
            value={values.email}
            placeholder="name@company.ru"
            autoComplete="username"
            aria-invalid={Boolean(errors.email) || emailTaken}
            className={fieldControlClassName(errors.email || (emailTaken ? "taken" : undefined))}
            onChange={(event) => {
              setEmailTaken(false)
              setField("email", event.target.value)
            }}
            onBlur={() => showFieldError("email", validateEmailValue(values.email))}
          />
        </FormField>
        {emailTaken ? (
          <p id="email-error" className="text-xs leading-relaxed text-destructive" role="alert">
            <EmailTakenError next={next} onSignIn={onSignIn} />
          </p>
        ) : null}

        <FormField
          id="password"
          label="Пароль"
          error={errors.password}
          required
          action={
            <button
              type="button"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              onClick={handleGeneratePassword}
            >
              Сгенерировать
            </button>
          }
        >
          <PasswordInput
            id="password"
            name="password"
            value={values.password}
            placeholder="Введите пароль"
            autoComplete="new-password"
            error={errors.password}
            visible={passwordVisible}
            onVisibleChange={setPasswordVisible}
            onChange={(event) => setField("password", event.target.value)}
            onBlur={() => showFieldError("password", validatePassword(values.password))}
          />
        </FormField>
        <PasswordStrengthMeter password={values.password} />
      </section>

      <section className="space-y-4 border-t border-border pt-6">
        <h2 className="text-sm font-semibold text-foreground">Согласия</h2>

        <label className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
          <input
            id="termsAccepted"
            name="termsAccepted"
            type="checkbox"
            checked={values.termsAccepted}
            aria-invalid={Boolean(errors.termsAccepted)}
            className="mt-1 size-4 shrink-0 rounded border-border accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => {
              setField("termsAccepted", event.target.checked)
              if (event.target.checked) showFieldError("termsAccepted")
            }}
          />
          <span>
            Я принимаю{" "}
            <Link href="/legal/terms" className="font-medium text-primary underline-offset-4 hover:underline">
              Пользовательское соглашение
            </Link>{" "}
            и{" "}
            <Link href="/legal/privacy" className="font-medium text-primary underline-offset-4 hover:underline">
              Политику конфиденциальности
            </Link>
          </span>
        </label>
        {errors.termsAccepted ? (
          <p id="termsAccepted-error" className="text-xs text-destructive" role="alert">
            {errors.termsAccepted}
          </p>
        ) : null}

        <label className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
          <input
            id="marketingConsent"
            name="marketingConsent"
            type="checkbox"
            checked={values.marketingConsent}
            className="mt-1 size-4 shrink-0 rounded border-border accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => setField("marketingConsent", event.target.checked)}
          />
          <span>Получать новости StoneTrail, новые экспертные материалы и информацию о камне</span>
        </label>
      </section>

      {formError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {formError}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting} className="h-11 w-full">
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Создание аккаунта…
          </>
        ) : (
          "Создать аккаунт"
        )}
      </Button>
    </form>
  )
}

export function RegisterFooterFromQuery() {
  const searchParams = useSearchParams()
  return <RegisterFooter next={searchParams.get("next")} />
}

export function RegisterFooter({
  next = null,
  onSignIn,
}: {
  next?: string | null
  onSignIn?: () => void
}) {
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login"
  const actionClassName = "font-medium text-primary underline-offset-4 hover:underline"

  return (
    <p className={cn("text-center")}>
      Уже есть аккаунт?{" "}
      {onSignIn ? (
        <button type="button" onClick={onSignIn} className={actionClassName}>
          Войти
        </button>
      ) : (
        <Link href={loginHref} className={actionClassName}>
          Войти
        </Link>
      )}
    </p>
  )
}
