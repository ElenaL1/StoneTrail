"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"
import { isAdmin } from "@/lib/content-utils"
import { ContentRequestError } from "@/lib/content-request"
import { newsApi } from "@/lib/feed/api-client"
import { formatFeedDate } from "@/lib/feed/format"
import type { IndustryNews, NewsStatus } from "@/lib/types"

const STATUS_LABELS: Record<NewsStatus, string> = {
  draft: "Черновик",
  coming_soon: "Скоро",
  published: "Опубликовано",
}

const emptyForm = {
  title: "",
  excerpt: "",
  content: "",
  status: "draft" as NewsStatus,
  slug: "",
}

export default function AdminNewsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<IndustryNews[]>([])
  const [deleted, setDeleted] = useState<IndustryNews[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<string | null>(null)
  const [error, setError] = useState("")

  const load = async () => {
    const [nextItems, nextDeleted] = await Promise.all([newsApi.listManaged(false), newsApi.listManaged(true)])
    setItems(nextItems)
    setDeleted(nextDeleted)
  }

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof ContentRequestError ? err.message : "Не удалось загрузить новости.")
    })
  }, [])

  const edit = (item: IndustryNews) => {
    setEditing(item.slug)
    setForm({
      title: item.title,
      excerpt: item.excerpt,
      content: item.content,
      status: item.status,
      slug: item.slug,
    })
  }

  const save = async () => {
    setError("")
    const payload = {
      title: form.title,
      excerpt: form.excerpt,
      content: form.content,
      status: form.status,
      slug: form.slug.trim() || undefined,
    }
    try {
      if (editing) await newsApi.update(editing, payload)
      else await newsApi.create(payload)
      setForm(emptyForm)
      setEditing(null)
      await load()
    } catch (err) {
      setError(err instanceof ContentRequestError ? err.message : "Не удалось сохранить новость.")
    }
  }

  const publish = async (slug: string) => {
    setError("")
    try {
      await newsApi.publish(slug)
      await load()
    } catch (err) {
      setError(err instanceof ContentRequestError ? err.message : "Не удалось опубликовать.")
    }
  }

  return (
    <div className="space-y-10">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <section className="space-y-4 rounded-2xl border border-border p-5">
        <h2 className="font-display text-2xl font-semibold">{editing ? "Править новость" : "Новая новость"}</h2>
        <Input placeholder="Заголовок" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        <Input placeholder="Адрес, если нужен свой" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
        <Textarea placeholder="Лид" value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} />
        <Textarea className="min-h-40" placeholder="Текст" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} />
        <label className="flex flex-col gap-1 text-sm">
          Статус
          <select
            className="h-10 rounded-md border border-border bg-background px-3"
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value as NewsStatus })}
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void save()}>{editing ? "Сохранить" : "Создать"}</Button>
          {editing ? (
            <Button variant="outline" onClick={() => { setEditing(null); setForm(emptyForm) }}>Сбросить</Button>
          ) : null}
        </div>
      </section>
      <NewsRows
        title="На сайте и в работе"
        items={items}
        onEdit={edit}
        onPublish={(slug) => void publish(slug)}
        onDelete={isAdmin(user?.role) ? async (slug) => { await newsApi.remove(slug); await load() } : undefined}
        onError={setError}
      />
      <NewsRows
        title="Удалённые"
        items={deleted}
        onRestore={isAdmin(user?.role) ? async (slug) => { await newsApi.restore(slug); await load() } : undefined}
        onError={setError}
      />
    </div>
  )
}

function NewsRows({
  title,
  items,
  onEdit,
  onPublish,
  onDelete,
  onRestore,
  onError,
}: {
  title: string
  items: IndustryNews[]
  onEdit?: (item: IndustryNews) => void
  onPublish?: (slug: string) => void
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
              {STATUS_LABELS[item.status]} · {formatFeedDate(item.publishedAt ?? item.updatedAt)} · /news/{item.slug}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {onEdit ? <Button size="sm" variant="outline" onClick={() => onEdit(item)}>Править</Button> : null}
            {onPublish && item.status !== "published" ? (
              <Button size="sm" onClick={() => onPublish(item.slug)}>Опубликовать</Button>
            ) : null}
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
