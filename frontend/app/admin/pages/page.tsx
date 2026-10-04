"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { adminApi, type PageSummary } from "@/lib/admin/api"
import { ContentRequestError } from "@/lib/content-request"

export default function AdminPagesIndex() {
  const [pages, setPages] = useState<PageSummary[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    adminApi.listPages().then(setPages).catch((err: unknown) => {
      setError(err instanceof ContentRequestError ? err.message : "Не удалось загрузить страницы.")
    })
  }, [])

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {pages.map((page) => (
        <Link
          key={page.pageKey}
          href={`/admin/pages/edit?key=${encodeURIComponent(page.pageKey)}`}
          className="flex items-center justify-between rounded-2xl border border-border px-5 py-4 hover:border-primary/40"
        >
          <span className="font-medium">{page.title}</span>
          <span className="text-sm text-muted-foreground">{page.legal ? "Юридический текст" : "Страница"}</span>
        </Link>
      ))}
    </div>
  )
}
