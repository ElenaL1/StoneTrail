"use client"

import { useEffect, useState } from "react"
import { adminApi, type AuditEvent } from "@/lib/admin/api"
import { ContentRequestError } from "@/lib/content-request"
import { formatRuDateTime } from "@/lib/content-utils"

const labels: Record<string, string> = {
  role_change: "Смена роли",
  article_publish: "Публикация статьи",
  article_delete: "Удаление статьи",
  article_restore: "Восстановление статьи",
  legal_publish: "Публикация юридического текста",
}

export default function AdminAuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    adminApi.audit().then(setEvents).catch((err: unknown) => {
      setError(err instanceof ContentRequestError ? err.message : "Не удалось загрузить журнал.")
    })
  }, [])

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {events.length === 0 ? <p className="text-sm text-muted-foreground">Пока нет записей.</p> : null}
      {events.map((event) => (
        <article key={event.id} className="rounded-2xl border border-border px-4 py-3">
          <p className="font-medium">{labels[event.action] ?? event.action}</p>
          <p className="text-sm text-muted-foreground">
            {event.entityType} · {formatRuDateTime(event.createdAt)}
          </p>
        </article>
      ))}
    </div>
  )
}
