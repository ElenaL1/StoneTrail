"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { EmailTakenError } from "@/components/auth/email-taken-error"
import { fieldControlClassName, FormField } from "@/components/auth/form-field"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { AUTH_MESSAGES } from "@/lib/auth/constants"
import { loginPath } from "@/lib/auth/paths"
import { validateEmailValue } from "@/lib/auth/validation"

export function VerifyEmailPanel() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const {
    user,
    inbox,
    isReady,
    verifyEmail,
    resendVerification,
    changeEmail,
    getResendAvailableAt,
  } = useAuth()

  const [status, setStatus] = useState<"pending" | "confirming" | "confirmed" | "error">(
    token ? "confirming" : "pending",
  )
  const [message, setMessage] = useState<string | null>(null)
  const [changingEmail, setChangingEmail] = useState(false)
  const [emailValue, setEmailValue] = useState(user?.email ?? "")
  const [emailError, setEmailError] = useState<string | undefined>()
  const [emailTaken, setEmailTaken] = useState(false)
  const [resendBusy, setResendBusy] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    setEmailValue(user?.email ?? "")
  }, [user?.email])

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      const result = await verifyEmail(token)
      if (cancelled) return
      if (result.ok) {
        setStatus("confirmed")
        router.replace("/verify-email?status=confirmed")
        return
      }
      setStatus("error")
      setMessage(result.message)
    })()
    return () => {
      cancelled = true
    }
  }, [router, token, verifyEmail])

  useEffect(() => {
    if ((searchParams.get("status") === "confirmed" || user?.emailVerified) && !token) {
      if (user?.emailVerified) setStatus("confirmed")
    }
  }, [searchParams, token, user?.emailVerified])

  const remaining = useMemo(() => {
    const availableAt = getResendAvailableAt()
    return Math.max(0, Math.ceil((availableAt - now) / 1000))
  }, [getResendAvailableAt, now])

  const handleResend = async () => {
    setMessage(null)
    setResendBusy(true)
    const result = await resendVerification()
    setResendBusy(false)
    if (!result.ok) {
      setMessage(result.message)
      return
    }
    setMessage("Письмо отправлено повторно.")
  }

  const handleChangeEmail = async (event: React.FormEvent) => {
    event.preventDefault()
    setEmailTaken(false)
    const nextError = validateEmailValue(emailValue)
    setEmailError(nextError)
    if (nextError) return

    setResendBusy(true)
    const result = await changeEmail(emailValue)
    setResendBusy(false)
    if (!result.ok) {
      setEmailTaken(result.code === "email_taken")
      setEmailError(result.code === "email_taken" ? undefined : result.fieldErrors?.email ?? result.message)
      return
    }
    setChangingEmail(false)
    setMessage("Письмо с подтверждением отправлено на новый адрес.")
  }

  if (!isReady || status === "confirming") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground" aria-busy="true">
        <Loader2 className="size-4 animate-spin" />
        Проверяем ссылку…
      </div>
    )
  }

  if (status === "confirmed") {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Email подтверждён</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">Ваш аккаунт StoneTrail активирован.</p>
        </div>
        <Button asChild className="h-11 w-full">
          <Link href="/profile">Перейти в профиль</Link>
        </Button>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Ссылка недействительна</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{message ?? AUTH_MESSAGES.verifyExpired}</p>
        </div>
        {user ? (
          <Button type="button" variant="outline" className="h-11 w-full" disabled={resendBusy || remaining > 0} onClick={handleResend}>
            {remaining > 0 ? AUTH_MESSAGES.resendWait(remaining) : "Отправить письмо повторно"}
          </Button>
        ) : (
          <Button asChild className="h-11 w-full">
            <Link href={loginPath("/verify-email")}>Войти</Link>
          </Button>
        )}
      </div>
    )
  }

  if (!user && !token) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Проверьте вашу почту</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Войдите в аккаунт, чтобы подтвердить email или запросить новое письмо.
          </p>
        </div>
        <Button asChild className="h-11 w-full">
          <Link href={loginPath("/verify-email")}>Войти</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Проверьте вашу почту</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Мы отправили письмо с подтверждением на {user?.email ? <strong className="text-foreground">{user.email}</strong> : "указанный email"}.
          Перейдите по ссылке в письме, чтобы активировать аккаунт StoneTrail.
        </p>
      </div>

      {message ? (
        <p className="text-sm text-foreground" role="status">
          {message}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full"
          disabled={resendBusy || remaining > 0}
          onClick={handleResend}
        >
          {resendBusy ? <Loader2 className="size-4 animate-spin" /> : null}
          {remaining > 0 ? AUTH_MESSAGES.resendWait(remaining) : "Не получили письмо? Отправить повторно"}
        </Button>
        <Button type="button" variant="ghost" className="h-11 w-full" onClick={() => setChangingEmail((value) => !value)}>
          Изменить email
        </Button>
      </div>

      {changingEmail ? (
        <form onSubmit={handleChangeEmail} className="space-y-4 rounded-lg border border-border p-4">
          <FormField id="email" label="Новый email" error={emailTaken ? undefined : emailError} required>
            <input
              id="email"
              name="email"
              type="email"
              value={emailValue}
              placeholder="name@company.ru"
              autoComplete="email"
              aria-invalid={Boolean(emailError) || emailTaken}
              className={fieldControlClassName(emailError || (emailTaken ? "taken" : undefined))}
              onChange={(event) => setEmailValue(event.target.value)}
            />
          </FormField>
          {emailTaken ? (
            <p className="text-xs text-destructive" role="alert">
              <EmailTakenError />
            </p>
          ) : null}
          <Button type="submit" disabled={resendBusy} className="h-11 w-full">
            Сохранить и отправить письмо
          </Button>
        </form>
      ) : null}

      {inbox?.type === "verify" ? (
        <p className="text-sm text-muted-foreground">
          Пока письма отправляются локально,{" "}
          <Link href={inbox.path} className="font-medium text-primary underline-offset-4 hover:underline">
            перейдите по ссылке подтверждения
          </Link>
          .
        </p>
      ) : null}
    </div>
  )
}
