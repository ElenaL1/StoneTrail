"use client"

import { useEffect, useRef, useState } from "react"
import { CheckCircle2, Loader2, UserRound } from "lucide-react"
import { fieldControlClassName, FormField } from "@/components/auth/form-field"
import { YandexAuthButton } from "@/components/auth/yandex-auth-button"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { ACTIVITY_TYPES } from "@/lib/auth/types"
import { AUTH_MESSAGES, AVATAR_ACCEPTED_TYPES, AVATAR_MAX_BYTES, COUNTRIES } from "@/lib/auth/constants"
import { formatPhone } from "@/lib/utils"
import { yandexNotice } from "@/lib/auth/paths"
import { validatePersonName, validateProfileInput, validateWebsite } from "@/lib/auth/validation"

export function ProfileForm() {
  const { user, updateProfile } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [values, setValues] = useState({
    nickname: user?.nickname ?? "",
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    company: user?.company ?? "",
    position: user?.position ?? "",
    activityType: user?.activityType ?? "",
    country: user?.country ?? "",
    city: user?.city ?? "",
    bio: user?.bio ?? "",
    website: user?.website ?? "",
    phone: user?.phone ?? "",
    avatar: user?.avatar ?? "",
    marketingConsent: user?.marketingConsent ?? false,
  })
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!user) return null

  const setField = (field: keyof typeof values, value: string | boolean) => {
    setValues((current) => ({ ...current, [field]: value }))
    setSaved(false)
  }

  const handleAvatar = (file: File | undefined) => {
    if (!file) return
    if (!(AVATAR_ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
      setErrors((current) => ({ ...current, avatar: AUTH_MESSAGES.avatarInvalid }))
      return
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setErrors((current) => ({ ...current, avatar: AUTH_MESSAGES.avatarTooLarge }))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setField("avatar", String(reader.result ?? ""))
      setErrors((current) => {
        const next = { ...current }
        delete next.avatar
        return next
      })
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)
    setSaved(false)
    const fieldErrors = validateProfileInput(values)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

    setSubmitting(true)
    const result = await updateProfile(values)
    setSubmitting(false)
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {})
      setFormError(result.fieldErrors ? null : result.message)
      return
    }
    setSaved(true)
  }

  return (
    <div className="space-y-10">
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex size-20 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
          {values.avatar ? (
            <img src={values.avatar} alt="Фото профиля" className="size-full object-cover" />
          ) : (
            <UserRound className="size-8 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-2">
          <Button type="button" variant="outline" className="h-10" onClick={() => fileRef.current?.click()}>
            Загрузить фото
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept={AVATAR_ACCEPTED_TYPES.join(",")}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => handleAvatar(event.target.files?.[0])}
          />
          {errors.avatar ? (
            <p className="text-xs text-destructive" role="alert">
              {errors.avatar}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">JPG, PNG или WebP, до 1 МБ.</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
        {user.emailVerified ? (
          <>
            <CheckCircle2 className="size-4 text-primary" />
            <span>Email подтверждён</span>
          </>
        ) : (
          <span>Email ещё не подтверждён. Проверьте почту или запросите новое письмо.</span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="firstName" label="Имя" hint="Не отображается на сайте." error={errors.firstName}>
          <input
            id="firstName"
            value={values.firstName}
            className={fieldControlClassName(errors.firstName)}
            onChange={(event) => setField("firstName", event.target.value)}
            onBlur={() =>
              setErrors((current) => ({
                ...current,
                firstName: validatePersonName(values.firstName, "firstName", false),
              }))
            }
          />
        </FormField>
        <FormField id="lastName" label="Фамилия" hint="Не отображается на сайте." error={errors.lastName}>
          <input
            id="lastName"
            value={values.lastName}
            className={fieldControlClassName(errors.lastName)}
            onChange={(event) => setField("lastName", event.target.value)}
            onBlur={() =>
              setErrors((current) => ({
                ...current,
                lastName: validatePersonName(values.lastName, "lastName", false),
              }))
            }
          />
        </FormField>
      </div>

      <FormField id="nickname" label="Ник на сайте" error={errors.nickname} required>
        <input
          id="nickname"
          value={values.nickname}
          className={fieldControlClassName(errors.nickname)}
          onChange={(event) => setField("nickname", event.target.value)}
        />
      </FormField>

      <FormField id="company" label="Компания">
        <input
          id="company"
          value={values.company}
          placeholder="Название компании"
          className={fieldControlClassName()}
          onChange={(event) => setField("company", event.target.value)}
        />
      </FormField>

      <FormField id="position" label="Должность / специализация">
        <input
          id="position"
          value={values.position}
          placeholder="Например: архитектор, дизайнер, камнеобработчик"
          className={fieldControlClassName()}
          onChange={(event) => setField("position", event.target.value)}
        />
      </FormField>

      <FormField id="activityType" label="Тип деятельности">
        <select
          id="activityType"
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

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="country" label="Страна">
          <select
            id="country"
            value={values.country}
            className={fieldControlClassName()}
            onChange={(event) => setField("country", event.target.value)}
          >
            <option value="">Выберите страну</option>
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="city" label="Город">
          <input
            id="city"
            value={values.city}
            placeholder="Москва"
            className={fieldControlClassName()}
            onChange={(event) => setField("city", event.target.value)}
          />
        </FormField>
      </div>

      <FormField id="bio" label="Краткое профессиональное описание">
        <textarea
          id="bio"
          value={values.bio}
          rows={4}
          placeholder="Чем вы занимаетесь в каменной отрасли"
          className={fieldControlClassName(undefined, "h-auto min-h-28 py-3")}
          onChange={(event) => setField("bio", event.target.value)}
        />
      </FormField>

      <FormField id="website" label="Сайт компании" error={errors.website}>
        <input
          id="website"
          value={values.website}
          placeholder="https://company.ru"
          className={fieldControlClassName(errors.website)}
          onChange={(event) => setField("website", event.target.value)}
          onBlur={() =>
            setErrors((current) => ({ ...current, website: validateWebsite(values.website) ?? "" }))
          }
        />
      </FormField>

      <FormField id="phone" label="Телефон">
        <input
          id="phone"
          type="tel"
          value={values.phone}
          placeholder="+7 (___) ___-__-__"
          className={fieldControlClassName()}
          onChange={(event) => setField("phone", formatPhone(event.target.value))}
        />
      </FormField>

      <label className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
        <input
          type="checkbox"
          checked={values.marketingConsent}
          className="mt-1 size-4 shrink-0 rounded border-border accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onChange={(event) => setField("marketingConsent", event.target.checked)}
        />
        <span>Получать новости StoneTrail, новые экспертные материалы и информацию о камне</span>
      </label>

      {formError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {formError}
        </p>
      ) : null}
      {saved ? (
        <p className="text-sm text-foreground" role="status">
          Профиль сохранён.
        </p>
      ) : null}

      <Button type="submit" disabled={submitting} className="h-11">
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Сохранение…
          </>
        ) : (
          "Сохранить профиль"
        )}
      </Button>
    </form>
    <YandexAccountSection linked={Boolean(user.yandexLinked)} />
    </div>
  )
}

function YandexAccountSection({ linked }: { linked: boolean }) {
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("yandex")
    if (code === "linked") return
    setNotice(yandexNotice(code))
  }, [])

  return (
    <section className="space-y-3 border-t border-border pt-8">
      <h2 className="text-sm font-medium text-foreground">Яндекс ID</h2>
      {notice ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {notice}
        </p>
      ) : null}
      {linked ? (
        <p className="text-sm text-muted-foreground" role="status">
          Яндекс ID подключён.
        </p>
      ) : (
        <YandexAuthButton intent="link" next="/profile" label="Подключить Яндекс ID" />
      )}
    </section>
  )
}
