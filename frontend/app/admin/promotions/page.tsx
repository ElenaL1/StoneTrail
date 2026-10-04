"use client"

import { useEffect, useState } from "react"
import { BANNER_TEMPLATES, PromoBanner, type BannerTemplateId } from "@/components/promo-banner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"
import { isAdmin } from "@/lib/content-utils"
import { ContentRequestError } from "@/lib/content-request"
import { promotionsApi, type PromotionInput } from "@/lib/feed/api-client"
import { expiryNote, formatFeedDate, fromExpiryInput, toExpiryInput } from "@/lib/feed/format"
import { cn } from "@/lib/utils"
import type { Promotion } from "@/lib/types"

const emptyForm = {
  title: "",
  description: "",
  content: "",
  template: "stone" as BannerTemplateId,
  buttonLabel: "Узнать детали",
  isEnabled: false,
  expiresAt: "",
  slug: "",
}

export default function AdminPromotionsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<Promotion[]>([])
  const [deleted, setDeleted] = useState<Promotion[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<string | null>(null)
  const [error, setError] = useState("")

  const load = async () => {
    const [nextItems, nextDeleted] = await Promise.all([
      promotionsApi.listManaged(false),
      promotionsApi.listManaged(true),
    ])
    setItems(nextItems)
    setDeleted(nextDeleted)
  }

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof ContentRequestError ? err.message : "Не удалось загрузить акции.")
    })
  }, [])

  const note = form.expiresAt ? expiryNote(fromExpiryInput(form.expiresAt)) : "Укажите дату окончания"

  const edit = (item: Promotion) => {
    setEditing(item.slug)
    setForm({
      title: item.title,
      description: item.description,
      content: item.content,
      template: item.template,
      buttonLabel: item.buttonLabel,
      isEnabled: item.isEnabled,
      expiresAt: toExpiryInput(item.expiresAt),
      slug: item.slug,
    })
  }

  const save = async () => {
    setError("")
    if (!form.expiresAt) {
      setError("Укажите дату окончания.")
      return
    }
    const payload: PromotionInput = {
      title: form.title,
      description: form.description,
      content: form.content,
      template: form.template,
      buttonLabel: form.buttonLabel,
      isEnabled: form.isEnabled,
      expiresAt: fromExpiryInput(form.expiresAt),
      slug: form.slug.trim() || undefined,
    }
    try {
      if (editing) await promotionsApi.update(editing, payload)
      else await promotionsApi.create(payload)
      setForm(emptyForm)
      setEditing(null)
      await load()
    } catch (err) {
      setError(err instanceof ContentRequestError ? err.message : "Не удалось сохранить акцию.")
    }
  }

  return (
    <div className="space-y-10">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <section className="space-y-4 rounded-2xl border border-border p-5">
        <h2 className="font-display text-2xl font-semibold">{editing ? "Править акцию" : "Новая акция"}</h2>
        <Input placeholder="Заголовок" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        <Input placeholder="Адрес, если нужен свой" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
        <Textarea placeholder="Текст баннера" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        <Textarea className="min-h-40" placeholder="Текст страницы акции" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input placeholder="Подпись кнопки" value={form.buttonLabel} onChange={(event) => setForm({ ...form, buttonLabel: event.target.value })} />
          <Input type="date" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isEnabled}
            onChange={(event) => setForm({ ...form, isEnabled: event.target.checked })}
          />
          Показывать в шапке
        </label>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {BANNER_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => setForm({ ...form, template: template.id })}
              className={cn(
                "overflow-hidden rounded-xl border text-left",
                form.template === template.id ? "border-primary ring-2 ring-primary" : "border-border",
              )}
            >
              <div className="relative h-24 overflow-hidden bg-muted/30">
                <div className="pointer-events-none absolute left-0 top-0 w-[400%] origin-top-left scale-[0.25]">
                  <PromoBanner
                    preview
                    template={template.id}
                    title={form.title || "Заголовок акции"}
                    description={form.description || "Короткое описание на баннере."}
                    note={note}
                    buttonLabel={form.buttonLabel || "Узнать детали"}
                  />
                </div>
              </div>
              <span className="block px-2 py-1.5 text-xs font-medium">{template.label}</span>
            </button>
          ))}
        </div>
        <div className="overflow-hidden rounded-2xl border border-border">
          <PromoBanner
            preview
            template={form.template}
            title={form.title || "Заголовок акции"}
            description={form.description || "Короткое описание на баннере."}
            note={note}
            buttonLabel={form.buttonLabel || "Узнать детали"}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void save()}>{editing ? "Сохранить" : "Создать"}</Button>
          {editing ? (
            <Button variant="outline" onClick={() => { setEditing(null); setForm(emptyForm) }}>Сбросить</Button>
          ) : null}
        </div>
      </section>
      <PromoRows
        title="Акции"
        items={items}
        onEdit={edit}
        onDelete={isAdmin(user?.role) ? async (slug) => { await promotionsApi.remove(slug); await load() } : undefined}
        onError={setError}
      />
      <PromoRows
        title="Удалённые"
        items={deleted}
        onRestore={isAdmin(user?.role) ? async (slug) => { await promotionsApi.restore(slug); await load() } : undefined}
        onError={setError}
      />
    </div>
  )
}

function PromoRows({
  title,
  items,
  onEdit,
  onDelete,
  onRestore,
  onError,
}: {
  title: string
  items: Promotion[]
  onEdit?: (item: Promotion) => void
  onDelete?: (slug: string) => Promise<void>
  onRestore?: (slug: string) => Promise<void>
  onError: (message: string) => void
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      {items.length === 0 ? <p className="text-sm text-muted-foreground">Нет записей.</p> : null}
      {items.map((item) => (
        <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3">
          <div>
            <p className="font-medium">{item.title}</p>
            <p className="text-xs text-muted-foreground">
              {item.isEnabled ? "В шапке" : "Скрыта"} · до {formatFeedDate(item.expiresAt)} · {item.template}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {onEdit ? <Button size="sm" variant="outline" onClick={() => onEdit(item)}>Править</Button> : null}
            {onDelete ? (
              <Button size="sm" variant="outline" onClick={() => void onDelete(item.slug).catch((err: unknown) => onError(err instanceof ContentRequestError ? err.message : "Не удалось удалить."))}>Удалить</Button>
            ) : null}
            {onRestore ? (
              <Button size="sm" variant="outline" onClick={() => void onRestore(item.slug).catch((err: unknown) => onError(err instanceof ContentRequestError ? err.message : "Не удалось восстановить."))}>Восстановить</Button>
            ) : null}
          </div>
        </div>
      ))}
    </section>
  )
}
