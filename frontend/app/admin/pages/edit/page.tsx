"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { adminApi, type PageAdmin } from "@/lib/admin/api"
import { useAuth } from "@/lib/auth-context"
import { ContentRequestError } from "@/lib/content-request"
import { isAdmin } from "@/lib/content-utils"

function PageEditor() {
  const params = useSearchParams()
  const pageKey = params.get("key") ?? ""
  const { user } = useAuth()
  const [page, setPage] = useState<PageAdmin | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [effectiveFrom, setEffectiveFrom] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  useEffect(() => {
    if (!pageKey) return
    adminApi.page(pageKey).then((loaded) => {
      setPage(loaded)
      setEffectiveFrom(loaded.effectiveFrom ?? "")
      setDrafts(Object.fromEntries(loaded.blocks.map((block) => [block.blockKey, block.draftValue || block.fallback])))
    }).catch((err: unknown) => {
      setError(err instanceof ContentRequestError ? err.message : "Не удалось открыть страницу.")
    })
  }, [pageKey])

  const save = async () => {
    if (!page) return
    setError("")
    const saved = await adminApi.savePage(
      page.pageKey,
      page.blocks.map((block) => ({ blockKey: block.blockKey, value: drafts[block.blockKey] ?? "" })),
    )
    setPage(saved)
    setNotice("Черновик сохранён. На сайте он появится после публикации.")
  }

  const publish = async () => {
    if (!page) return
    setError("")
    await save()
    const published = await adminApi.publishPage(page.pageKey, page.legal ? effectiveFrom : undefined)
    setPage(published)
    setNotice("Страница опубликована.")
  }

  if (!page) {
    return <p className="text-sm text-muted-foreground">{error || "Загрузка…"}</p>
  }

  const canPublish = !page.legal || isAdmin(user?.role)

  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl font-semibold">{page.title}</h2>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {notice ? <p className="text-sm">{notice}</p> : null}
      {page.blocks.map((block) => (
        <label key={block.blockKey} className="block space-y-2">
          <span className="text-sm font-medium">{block.label}</span>
          {block.publishedValue ? (
            <p className="text-xs text-muted-foreground">Сейчас на сайте: {block.publishedValue}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Пока показывается текст из вёрстки.</p>
          )}
          <Textarea
            value={drafts[block.blockKey] ?? ""}
            onChange={(event) => setDrafts({ ...drafts, [block.blockKey]: event.target.value })}
            rows={block.kind === "markdown" ? 12 : 3}
          />
        </label>
      ))}
      {page.legal ? (
        <label className="block space-y-2 text-sm">
          Дата вступления в силу
          <input
            type="date"
            className="mt-1 block rounded-md border border-border bg-background px-3 py-2"
            value={effectiveFrom}
            onChange={(event) => setEffectiveFrom(event.target.value)}
          />
        </label>
      ) : null}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => void save().catch((err: unknown) => setError(err instanceof ContentRequestError ? err.message : "Не удалось сохранить."))}>
          Сохранить черновик
        </Button>
        {canPublish ? (
          <Button onClick={() => void publish().catch((err: unknown) => setError(err instanceof ContentRequestError ? err.message : "Не удалось опубликовать."))}>
            Опубликовать
          </Button>
        ) : (
          <p className="self-center text-sm text-muted-foreground">Юридический текст публикует администратор.</p>
        )}
      </div>
    </div>
  )
}

export default function AdminPageEdit() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Загрузка…</p>}>
      <PageEditor />
    </Suspense>
  )
}
