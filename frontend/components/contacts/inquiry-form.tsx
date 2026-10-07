"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"
import { useAuthModal } from "@/lib/auth-modal-context"
import { ContentRequestError } from "@/lib/content-request"
import { sendInquiry } from "@/lib/inquiry-api"
import {
  readInquiryDraft,
  removeInquiryLine,
  resetInquiryDraft,
  writeInquiryDraft,
  type InquiryLine,
} from "@/lib/inquiry-draft"

export function InquiryForm() {
  const { user, isReady } = useAuth()
  const { openLogin } = useAuthModal()
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [lines, setLines] = useState<InquiryLine[]>([])
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isReady) return
    if (!user) {
      setName("")
      setMessage("")
      setLines([])
      return
    }
    const draft = readInquiryDraft(user.id)
    setName(draft.name ?? user.nickname)
    setMessage(draft.message)
    setLines(draft.lines)
  }, [isReady, user])

  function persist(next: { name?: string; message?: string; lines?: InquiryLine[] }) {
    if (!user) return
    const current = readInquiryDraft(user.id)
    writeInquiryDraft(user.id, {
      name: next.name ?? current.name,
      message: next.message ?? current.message,
      lines: next.lines ?? current.lines,
    })
  }

  function onNameChange(value: string) {
    setName(value)
    setSent(false)
    persist({ name: value })
  }

  function onMessageChange(value: string) {
    setMessage(value)
    setSent(false)
    persist({ message: value })
  }

  function onRemove(lineId: string) {
    if (!user) return
    const next = removeInquiryLine(user.id, lineId)
    setLines(next.lines)
    setSent(false)
  }

  function onReset() {
    setError(null)
    setSent(false)
    if (!user) {
      setName("")
      setMessage("")
      setLines([])
      return
    }
    resetInquiryDraft(user.id)
    setName(user.nickname)
    setMessage("")
    setLines([])
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSent(false)
    if (!user) {
      openLogin({ next: "/contacts" })
      return
    }
    const trimmedName = name.trim()
    const trimmedMessage = message.trim()
    if (!trimmedName) {
      setError("Укажите имя.")
      return
    }
    if (!trimmedMessage && lines.length === 0) {
      setError("Добавьте позицию или опишите задачу.")
      return
    }
    setSubmitting(true)
    try {
      await sendInquiry({ name: trimmedName, message: trimmedMessage, lines })
      resetInquiryDraft(user.id)
      setName(user.nickname)
      setMessage("")
      setLines([])
      setSent(true)
    } catch (caught) {
      const fallback = "Не удалось отправить заявку. Попробуйте ещё раз."
      setError(caught instanceof ContentRequestError ? caught.message : fallback)
    } finally {
      setSubmitting(false)
    }
  }

  const dirty =
    lines.length > 0 || message.trim().length > 0 || (user ? name !== user.nickname : name.trim().length > 0)

  return (
    <form className="rounded-2xl border border-border bg-card p-7" onSubmit={onSubmit} noValidate>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Быстрая заявка</p>
      <div className="mt-5 space-y-4">
        {lines.length > 0 ? (
          <ul className="space-y-2" aria-label="Позиции заявки">
            {lines.map((line) => (
              <li key={line.id} className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{line.title}</p>
                    {line.summary ? <p className="mt-1 text-sm text-muted-foreground">{line.summary}</p> : null}
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(line.id)}>
                    Убрать
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="contacts-name">
            Имя
          </label>
          <Input
            id="contacts-name"
            type="text"
            value={name}
            placeholder="Имя и компания"
            className="h-11"
            onChange={(event) => onNameChange(event.target.value)}
            disabled={!isReady || submitting}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="contacts-email">
            Email
          </label>
          <Input
            id="contacts-email"
            type="email"
            value={user?.email ?? ""}
            placeholder="you@company.ru"
            className="h-11 read-only:bg-muted/40"
            readOnly
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="contacts-message">
            Опишите задачу
          </label>
          <Textarea
            id="contacts-message"
            rows={4}
            value={message}
            placeholder="Проект, материал, сроки…"
            onChange={(event) => onMessageChange(event.target.value)}
            disabled={!isReady || submitting}
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {sent ? (
          <p className="text-sm text-foreground" role="status">
            Заявка отправлена.
          </p>
        ) : null}
        <Button type="submit" className="h-11 w-full gap-2 text-sm" disabled={!isReady || submitting}>
          Отправить
          <Send className="size-4" />
        </Button>
        {dirty ? (
          <Button type="button" variant="outline" className="h-11 w-full text-sm" onClick={onReset} disabled={submitting}>
            Сбросить
          </Button>
        ) : null}
        <p className="text-xs leading-relaxed text-muted-foreground">
          Нажимая «Отправить», вы соглашаетесь с обработкой данных согласно{" "}
          <a href="/legal/privacy" className="text-primary hover:underline">
            Политике конфиденциальности
          </a>
          .
        </p>
      </div>
    </form>
  )
}
