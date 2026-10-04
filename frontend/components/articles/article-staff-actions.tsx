"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { articlesApi } from "@/lib/articles/api-client"
import { useAdminMode } from "@/lib/admin-mode"
import { useAuth } from "@/lib/auth-context"
import { isAdmin, isStaff } from "@/lib/content-utils"
import { ContentRequestError } from "@/lib/content-request"
import { useState } from "react"

export function ArticleStaffActions({
  slug,
  status,
  onChanged,
}: {
  slug: string
  status: string
  onChanged: () => void
}) {
  const { enabled } = useAdminMode()
  const { user } = useAuth()
  const [note, setNote] = useState("")
  const [error, setError] = useState("")
  if (!enabled || !isStaff(user?.role)) return null

  const act = async (action: "publish" | "request_changes" | "reject") => {
    setError("")
    try {
      await articlesApi.moderate(slug, action, note)
      onChanged()
    } catch (err) {
      setError(err instanceof ContentRequestError ? err.message : "Не удалось выполнить действие.")
    }
  }

  return (
    <div className="mb-6 space-y-3 rounded-2xl border border-border bg-card p-4">
      <p className="text-sm font-medium">Режим администратора</p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {status === "pending_review" || status === "needs_revision" ? (
        <>
          <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Комментарий автору" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void act("publish")}>Одобрить</Button>
            <Button size="sm" variant="outline" onClick={() => void act("request_changes")}>Вернуть</Button>
            <Button size="sm" variant="outline" onClick={() => void act("reject")}>Отклонить</Button>
          </div>
        </>
      ) : null}
      {status === "published" && isAdmin(user?.role) ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => void articlesApi.remove(slug).then(onChanged).catch((err: unknown) => {
            setError(err instanceof ContentRequestError ? err.message : "Не удалось удалить.")
          })}
        >
          Удалить статью
        </Button>
      ) : null}
    </div>
  )
}
