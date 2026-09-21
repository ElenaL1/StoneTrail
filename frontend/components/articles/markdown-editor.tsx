"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MarkdownContent } from "@/lib/markdown"

type MarkdownEditorProps = {
  value: string
  onChange: (value: string) => void
}

function wrap(source: string, start: number, end: number, before: string, after: string, placeholder: string) {
  const selected = source.slice(start, end) || placeholder
  return {
    next: source.slice(0, start) + before + selected + after + source.slice(end),
    cursor: start + before.length + selected.length + after.length,
  }
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const insert = (before: string, after: string, placeholder: string) => {
    const area = ref.current
    const start = area?.selectionStart ?? value.length
    const end = area?.selectionEnd ?? value.length
    const result = wrap(value, start, end, before, after, placeholder)
    onChange(result.next)
    requestAnimationFrame(() => {
      area?.focus()
      area?.setSelectionRange(result.cursor, result.cursor)
    })
  }

  useEffect(() => {
    const area = ref.current
    if (!area) return
    area.style.height = "auto"
    area.style.height = `${Math.max(area.scrollHeight, 240)}px`
  }, [value])

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1">
          <Button type="button" size="sm" variant="outline" onClick={() => insert("## ", "", "Заголовок")}>H2</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => insert("### ", "", "Подзаголовок")}>H3</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => insert("**", "**", "жирный")}>Ж</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => insert("- ", "", "пункт списка")}>Список</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => insert("> ", "", "цитата")}>Цитата</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => insert("[", "](https://)", "ссылка")}>Ссылка</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => insert("![", "](https://)", "подпись")}>Фото</Button>
        </div>
        <Textarea
          ref={ref}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Текст статьи в Markdown: заголовки, списки, цитаты, ссылки и фото по URL."
          className="min-h-[240px] font-mono text-sm"
        />
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Превью</p>
        {value.trim() ? (
          <MarkdownContent value={value} />
        ) : (
          <p className="text-sm text-muted-foreground">Здесь появится предварительный просмотр.</p>
        )}
      </div>
    </div>
  )
}
