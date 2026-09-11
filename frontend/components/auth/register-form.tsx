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
import { ACTIVITY_TYPES } from "@/lib/auth/types"
import {
  validateEmailValue,
  validatePassword,
  validatePasswordConfirmation,
  validatePersonName,
  validateRegisterInput,
} from "@/lib/auth/validation"
import { cn } from "@/lib/utils"

const initialValues = {
  nickname: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  company: "",
  position: "",
  activityType: "",
  termsAccepted: false,
  marketingConsent: false,
}

export function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register } = useAuth()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [emailTaken, setEmailTaken] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const setField = (field: keyof typeof initialValues, value: string | boolean) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const showFieldError = (field: string, message?: string) => {
    setErrors((current) => {
      const next = { ...current }
      if (message) next[field] = message
      else delete next[field]
      return next
    })
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

    router.push("/verify-email")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Основные данные</h2>

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
            aria-invalid={Boolean(errors.nickname)}
            className={fieldControlClassName(errors.nickname)}
            onChange={(event) => setField("nickname", event.target.value)}
            onBlur={() => showFieldError("nickname", validatePersonName(values.nickname, "nickname"))}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="firstName"
            label="Имя"
            hint="Не отображается на сайте."
            error={errors.firstName}
            required
          >
            <input
              id="firstName"
              name="firstName"
              value={values.firstName}
              placeholder="Ваше имя"
              autoComplete="given-name"
              aria-invalid={Boolean(errors.firstName)}
              className={fieldControlClassName(errors.firstName)}
              onChange={(event) => setField("firstName", event.target.value)}
              onBlur={() => showFieldError("firstName", validatePersonName(values.firstName, "firstName"))}
            />
          </FormField>

          <FormField
            id="lastName"
            label="Фамилия"
            hint="Не отображается на сайте."
            error={errors.lastName}
            required
          >
            <input
              id="lastName"
              name="lastName"
              value={values.lastName}
              placeholder="Ваша фамилия"
              autoComplete="family-name"
              aria-invalid={Boolean(errors.lastName)}
              className={fieldControlClassName(errors.lastName)}
              onChange={(event) => setField("lastName", event.target.value)}
              onBlur={() => showFieldError("lastName", validatePersonName(values.lastName, "lastName"))}
            />
          </FormField>
        </div>

        <FormField
          id="email"
          label="Email"
          error={emailTaken ? undefined : errors.email}
          required
        >
          <input
            id="email"
            name="email"
            type="email"
            value={values.email}
            placeholder="name@company.ru"
            autoComplete="email"
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
            <EmailTakenError next={searchParams.get("next")} />
          </p>
        ) : null}

        <FormField id="password" label="Пароль" error={errors.password} required>
          <PasswordInput
            id="password"
            name="password"
            value={values.password}
            placeholder="Введите пароль"
            autoComplete="new-password"
            error={errors.password}
            onChange={(event) => setField("password", event.target.value)}
            onBlur={() => showFieldError("password", validatePassword(values.password))}
          />
        </FormField>
        <PasswordStrengthMeter password={values.password} />

        <FormField id="confirmPassword" label="Подтверждение пароля" error={errors.confirmPassword} required>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            value={values.confirmPassword}
            placeholder="Повторите пароль"
            autoComplete="new-password"
            error={errors.confirmPassword}
            onChange={(event) => setField("confirmPassword", event.target.value)}
            onBlur={() =>
              showFieldError("confirmPassword", validatePasswordConfirmation(values.password, values.confirmPassword))
            }
          />
        </FormField>
      </section>

      <section className="space-y-4 border-t border-border pt-6">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">Профессиональная информация</h2>
          <p className="text-xs text-muted-foreground">Можно заполнить позже в профиле.</p>
        </div>

        <FormField id="company" label="Компания">
          <input
            id="company"
            name="company"
            value={values.company}
            placeholder="Название компании"
            autoComplete="organization"
            className={fieldControlClassName()}
            onChange={(event) => setField("company", event.target.value)}
          />
        </FormField>

        <FormField id="position" label="Должность / специализация">
          <input
            id="position"
            name="position"
            value={values.position}
            placeholder="Например: архитектор, дизайнер, камнеобработчик"
            autoComplete="organization-title"
            className={fieldControlClassName()}
            onChange={(event) => setField("position", event.target.value)}
          />
        </FormField>

        <FormField id="activityType" label="Тип деятельности">
          <select
            id="activityType"
            name="activityType"
            value={values.activityType}
            className={fieldControlClassName()}
            onChange={(event) => setField("activityType", event.target.value)}
          >
            <option value="">Выберите тип деятельности</option>
            {ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </FormField>
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

export function RegisterFooter() {
  const searchParams = useSearchParams()
  const next = searchParams.get("next")
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login"

  return (
    <p className={cn("text-center")}>
      Уже есть аккаунт?{" "}
      <Link href={loginHref} className="font-medium text-primary underline-offset-4 hover:underline">
        Войти
      </Link>
    </p>
  )
}
