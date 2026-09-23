"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { forumApi } from "@/lib/forum/api-client"
import { ContentRequestError } from "@/lib/content-request"
import type { ContentCategory } from "@/lib/types"
import { PlusCircle } from "lucide-react"

type CreateTopicModalProps = {
  onCreated?: () => void
}

export function CreateTopicModal({ onCreated }: CreateTopicModalProps) {
  const { isReady, user } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<ContentCategory[]>([])
  const [title, setTitle] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [content, setContent] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user?.emailVerified) return
    let cancelled = false
    void forumApi
      .listCategories()
      .then((rows) => {
        if (cancelled) return
        setCategories(rows)
        setCategoryId((current) => current || rows[0]?.id || "")
        if (rows.length === 0) {
          setError("Не удалось загрузить категории. Попробуйте обновить страницу.")
        }
      })
      .catch(() => {
        if (cancelled) return
        setError("Не удалось загрузить категории. Попробуйте обновить страницу.")
      })
    return () => {
      cancelled = true
    }
  }, [user?.emailVerified])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.emailVerified) return
    if (!categoryId) {
      setError("Не удалось загрузить категории. Попробуйте обновить страницу.")
      return
    }
    setSubmitting(true)
    setError("")
    try {
      const post = await forumApi.createPost({ title, categoryId, content })
      setOpen(false)
      setTitle("")
      setContent("")
      onCreated?.()
      router.push(`/community/${post.slug}`)
    } catch (err) {
      setError(err instanceof ContentRequestError ? err.message : "Не удалось создать тему.")
    } finally {
      setSubmitting(false)
    }
  }

  if (!isReady || !user) {
    return null
  }

  if (!user.emailVerified) {
    return (
      <Button asChild className="gap-2">
        <Link href="/verify-email">
          <PlusCircle className="size-4" />
          Подтвердите email, чтобы создать тему
        </Link>
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusCircle className="size-4" />
          Создать тему
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Создать новую тему</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Заголовок</label>
            <Input
              placeholder="Введите название темы..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Категория</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Сообщение</label>
            <Textarea
              placeholder="Опишите ваш вопрос или поделитесь опытом..."
              className="min-h-[150px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">{error}</p>
          ) : null}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Отменить
            </Button>
            <Button type="submit" disabled={submitting || !categoryId}>
              {submitting ? "Публикация…" : "Опубликовать"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
