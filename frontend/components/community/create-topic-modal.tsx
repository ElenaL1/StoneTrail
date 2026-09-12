"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OpenAuthButton } from "@/components/auth/open-auth-button"
import { useAuth } from "@/lib/auth-context"
import { forumCategories } from "@/lib/mock-data"
import { PlusCircle } from "lucide-react"

export function CreateTopicModal() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    category: forumCategories[0],
    content: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.emailVerified) return
    setOpen(false)
    alert("Тема успешно создана (имитация)!")
  }

  if (!user) {
    return (
      <OpenAuthButton view="login" next="/community" className="gap-2">
        <PlusCircle className="size-4" />
        Создать тему
      </OpenAuthButton>
    )
  }

  if (!user.emailVerified) {
    return (
      <Button asChild className="gap-2">
        <Link href="/verify-email">
          <PlusCircle className="size-4" />
          Создать тему
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
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Категория</label>
            <Select
              value={formData.category}
              onValueChange={(val) => setFormData({ ...formData, category: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {forumCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Сообщение</label>
            <Textarea
              placeholder="Опишите ваш вопрос или поделитесь опытом..."
              className="min-h-[150px]"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Отменить
            </Button>
            <Button type="submit">
              Опубликовать
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
