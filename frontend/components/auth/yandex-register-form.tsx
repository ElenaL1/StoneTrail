"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { fieldControlClassName, FormField } from "@/components/auth/form-field"
import { Button } from "@/components/ui/button"
import { authApi } from "@/lib/auth/api-client"
import { useAuth } from "@/lib/auth-context"
import { AUTH_MESSAGES } from "@/lib/auth/constants"
import { validatePersonName } from "@/lib/auth/validation"

export function YandexRegisterForm() {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const [email, setEmail] = useState("")
  const [nickname, setNickname] = useState("")
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const result = await authApi.yandexPending()
      if (cancelled) return
      if (!result.ok) {
        setFormError(result.message)
        setLoading(false)
        return
      }
      setEmail(result.data.email)
      setNickname(result.data.suggestedNickname)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)
    const nextErrors: Record<string, string> = {}
    const nicknameError = validatePersonName(nickname, "nickname")
    if (nicknameError) nextErrors.nickname = nicknameError
    if (!termsAccepted) nextErrors.termsAccepted = AUTH_MESSAGES.termsRequired
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    const result = await authApi.completeYandex({ nickname, termsAccepted })
    setSubmitting(false)
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {})
      setFormError(result.fieldErrors ? null : result.message)
      return
    }
    await refreshUser()
    router.push("/profile")
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>
  }

  if (!email) {
    return (
      <div className="space-y-4">
        {formError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {formError}
          </p>
        ) : null}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Вернуться ко входу
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Почта {email} получена от Яндекса. Выберите ник и примите условия, чтобы закончить регистрацию.
      </p>
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
          value={nickname}
          placeholder="Ваше имя"
          autoComplete="nickname"
          aria-invalid={Boolean(errors.nickname)}
          className={fieldControlClassName(errors.nickname)}
          onChange={(event) => setNickname(event.target.value)}
        />
      </FormField>
      <div className="space-y-2">
        <label className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
          <input
            id="termsAccepted"
            name="termsAccepted"
            type="checkbox"
            checked={termsAccepted}
            aria-invalid={Boolean(errors.termsAccepted)}
            className="mt-1 size-4 shrink-0 rounded border-border accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => setTermsAccepted(event.target.checked)}
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
          <p className="text-xs text-destructive" role="alert">
            {errors.termsAccepted}
          </p>
        ) : null}
      </div>
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
          "Завершить регистрацию"
        )}
      </Button>
    </form>
  )
}
