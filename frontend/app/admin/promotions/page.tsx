"use client"

import { useEffect, useRef, useState } from "react"
import { BANNER_TEMPLATES, PromoBanner, type BannerTemplateId } from "@/components/promo-banner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"
import { isAdmin } from "@/lib/content-utils"
import { ContentRequestError } from "@/lib/content-request"
import { promotionsApi, type PromotionInput, type PromotionLinesInput } from "@/lib/feed/api-client"
import { catalogApi } from "@/lib/catalog/api-client"
import { adminApi, type CatalogLookups } from "@/lib/admin/api"
import { formatOfferPrice } from "@/lib/promotions/offer-price"
import { expiryNote, formatFeedDate, fromExpiryInput, toExpiryInput } from "@/lib/feed/format"
import { cn } from "@/lib/utils"
import type { Material, Promotion, PromotionLine } from "@/lib/types"

type StoneChoice = {
  slug: string
  create: boolean
  quarry: string
  country: string
  typeCode: string
}

const emptyForm = {
  title: "",
  description: "",
  content: "",
  template: "stone" as BannerTemplateId,
  buttonLabel: "Узнать детали",
  inquiryLabel: "Запросить",
  isEnabled: false,
  publishToCatalog: false,
  offerNote: "",
  expiresAt: "",
  slug: "",
}

export default function AdminPromotionsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<Promotion[]>([])
  const [deleted, setDeleted] = useState<Promotion[]>([])
  const [form, setForm] = useState(emptyForm)
  const [lines, setLines] = useState<PromotionLine[]>([])
  const [stones, setStones] = useState<Material[]>([])
  const [lookups, setLookups] = useState<CatalogLookups | null>(null)
  const [choices, setChoices] = useState<Record<string, StoneChoice>>({})
  const [sheetImage, setSheetImage] = useState<File | null>(null)
  const [sheetPdf, setSheetPdf] = useState<File | null>(null)
  const [sheetStatus, setSheetStatus] = useState<"idle" | "reading" | "ready" | "failed">("idle")
  const [editing, setEditing] = useState<string | null>(null)
  const [error, setError] = useState("")
  const importToken = useRef(0)

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
    void Promise.all([catalogApi.listStones(), adminApi.lookups()])
      .then(([nextStones, nextLookups]) => {
        setStones(nextStones)
        setLookups(nextLookups)
      })
      .catch(() => setError("Не удалось загрузить камни."))
  }, [])

  const note = form.expiresAt ? expiryNote(fromExpiryInput(form.expiresAt)) : "Укажите дату окончания"

  const edit = async (item: Promotion) => {
    setError("")
    let full: Promotion
    try {
      full = await promotionsApi.get(item.slug)
    } catch (err: unknown) {
      setError(err instanceof ContentRequestError ? err.message : "Не удалось открыть акцию.")
      return
    }
    setEditing(full.slug)
    setLines(full.lines ?? [])
    setChoices(choicesFromLines(full.lines ?? []))
    setSheetImage(null)
    setSheetPdf(null)
    setSheetStatus("idle")
    importToken.current += 1
    setForm({
      title: full.title,
      description: full.description,
      content: full.content,
      template: full.template,
      buttonLabel: full.buttonLabel,
      inquiryLabel: full.inquiryLabel || "Запросить",
      isEnabled: full.isEnabled,
      publishToCatalog: full.publishToCatalog,
      offerNote: full.offerNote ?? "",
      expiresAt: toExpiryInput(full.expiresAt),
      slug: full.slug,
    })
  }

  const save = async () => {
    setError("")
    if (!form.expiresAt) {
      setError("Укажите дату окончания.")
      return
    }
    if (sheetStatus === "reading") {
      setError("Подождите, прайс ещё читается.")
      return
    }
    if (sheetStatus === "failed" || (sheetStatus === "ready" && lines.length === 0)) {
      setError("Файл выбран, но строки прайса не разобраны.")
      return
    }
    const payload: PromotionInput = {
      title: form.title,
      description: form.description,
      content: form.content,
      template: form.template,
      buttonLabel: form.buttonLabel,
      inquiryLabel: form.inquiryLabel || "Запросить",
      isEnabled: form.isEnabled,
      publishToCatalog: form.publishToCatalog,
      offerNote: form.offerNote,
      expiresAt: fromExpiryInput(form.expiresAt),
      slug: form.slug.trim() || undefined,
    }
    try {
      const saved = editing
        ? await promotionsApi.update(editing, payload)
        : await promotionsApi.create(payload)
      if (lines.length > 0) {
        await promotionsApi.replaceLines(saved.slug, linesPayload(lines, choices, form))
      }
      if (sheetImage) await promotionsApi.attachSheet(saved.slug, sheetImage)
      if (sheetPdf) await promotionsApi.attachSheet(saved.slug, sheetPdf)
      setForm(emptyForm)
      setLines([])
      setChoices({})
      setSheetImage(null)
      setSheetPdf(null)
      setSheetStatus("idle")
      importToken.current += 1
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
        <div className="grid gap-4 sm:grid-cols-3">
          <Input placeholder="Кнопка баннера" value={form.buttonLabel} onChange={(event) => setForm({ ...form, buttonLabel: event.target.value })} />
          <Input placeholder="Кнопка на странице" value={form.inquiryLabel} onChange={(event) => setForm({ ...form, inquiryLabel: event.target.value })} />
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
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.publishToCatalog}
            onChange={(event) => setForm({ ...form, publishToCatalog: event.target.checked })}
          />
          Публиковать в каталог
        </label>
        <Textarea
          placeholder="Сноска к прайсу"
          value={form.offerNote}
          onChange={(event) => setForm({ ...form, offerNote: event.target.value })}
        />
        <label className="block text-sm">
          Прайс Excel
          <Input
            type="file"
            accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return
              const token = importToken.current + 1
              importToken.current = token
              setSheetStatus("reading")
              setError("")
              void promotionsApi.importSheet(file).then((preview) => {
                if (importToken.current !== token) return
                setLines(preview.lines)
                setChoices(choicesFromLines(preview.lines))
                if (preview.offerNote) setForm((current) => ({ ...current, offerNote: preview.offerNote }))
                if (preview.lines.length === 0) {
                  setSheetStatus("failed")
                  setError("В файле нет строк прайса.")
                  return
                }
                setSheetStatus("ready")
              }).catch((err: unknown) => {
                if (importToken.current !== token) return
                setSheetStatus("failed")
                setLines([])
                setError(err instanceof ContentRequestError ? err.message : "Не удалось разобрать файл.")
              })
            }}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            Картинка листа
            <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setSheetImage(event.target.files?.[0] ?? null)} />
          </label>
          <label className="block text-sm">
            PDF листа
            <Input type="file" accept="application/pdf,.pdf" onChange={(event) => setSheetPdf(event.target.files?.[0] ?? null)} />
          </label>
        </div>
        <OfferPreview
          lines={lines}
          stones={stones}
          lookups={lookups}
          choices={choices}
          onChoice={(name, choice) => setChoices({ ...choices, [name]: choice })}
          onKind={(index, kind) => setLines(lines.map((line, lineIndex) => lineIndex === index ? { ...line, kind, unresolved: false, issue: null } : line))}
        />
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
        {sheetStatus === "reading" ? <p className="text-sm text-muted-foreground">Читаем прайс…</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button disabled={sheetStatus === "reading"} onClick={() => void save()}>{editing ? "Сохранить" : "Создать"}</Button>
          {editing ? (
            <Button variant="outline" onClick={() => { importToken.current += 1; setEditing(null); setForm(emptyForm); setLines([]); setChoices({}); setSheetStatus("idle") }}>Сбросить</Button>
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
              {item.lineCount ? ` · ${item.lineCount} поз.` : ""}
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

function choicesFromLines(rows: PromotionLine[]): Record<string, StoneChoice> {
  const next: Record<string, StoneChoice> = {}
  for (const row of rows) {
    const name = row.stoneName || row.groupName
    if (next[name]) continue
    next[name] = {
      slug: row.stoneSlug ?? "",
      create: false,
      quarry: "",
      country: "Россия",
      typeCode: "granite",
    }
  }
  return next
}

function linesPayload(
  rows: PromotionLine[],
  choices: Record<string, StoneChoice>,
  form: { offerNote: string; publishToCatalog: boolean },
): PromotionLinesInput {
  return {
    offerNote: form.offerNote,
    publishToCatalog: form.publishToCatalog,
    lines: rows.map((row) => {
      const choice = choices[row.stoneName || row.groupName]
      const create = Boolean(choice?.create && !choice.slug)
      return {
        kind: row.kind,
        groupName: row.groupName,
        stoneName: row.stoneName,
        label: row.label,
        stoneSlug: choice?.slug || row.stoneSlug || null,
        createStone: create
          ? { stoneTypeCode: choice.typeCode, quarry: choice.quarry, country: choice.country }
          : null,
        finish: row.finish,
        lengthMm: row.lengthMm,
        widthMm: row.widthMm,
        thicknessMm: row.thicknessMm,
        heightMm: row.heightMm,
        weightKg: row.weightKg,
        areaM2: row.areaM2,
        priceAmount: row.priceAmount,
        priceUnit: row.priceUnit,
        unresolved: row.unresolved,
        issue: row.issue,
      }
    }),
  }
}

function OfferPreview({
  lines,
  stones,
  lookups,
  choices,
  onChoice,
  onKind,
}: {
  lines: PromotionLine[]
  stones: Material[]
  lookups: CatalogLookups | null
  choices: Record<string, StoneChoice>
  onChoice: (name: string, choice: StoneChoice) => void
  onKind: (index: number, kind: PromotionLine["kind"]) => void
}) {
  if (lines.length === 0) return null
  const names = [...new Set(lines.map((line) => line.stoneName || line.groupName))]
  return (
    <div className="space-y-4 rounded-2xl border border-border p-4">
      <p className="text-sm text-muted-foreground">
        Разобрано строк: {lines.length}. Неразобранных: {lines.filter((line) => line.unresolved).length}.
      </p>
      {names.map((name) => {
        const choice = choices[name] ?? { slug: "", create: false, quarry: "", country: "Россия", typeCode: "granite" }
        if (choice.slug) return null
        return (
          <div key={name} className="space-y-2">
            <p className="text-sm font-medium">{name}</p>
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={choice.slug}
              onChange={(event) => onChoice(name, { ...choice, slug: event.target.value, create: false })}
            >
              <option value="">Камень в каталоге не выбран</option>
              {stones.map((stone) => (
                <option key={stone.id} value={stone.id}>{stone.name}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={choice.create}
                onChange={(event) => onChoice(name, { ...choice, create: event.target.checked, slug: event.target.checked ? "" : choice.slug })}
              />
              Создать камень
            </label>
            {choice.create ? (
              <div className="grid gap-2 sm:grid-cols-3">
                <select
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={choice.typeCode}
                  onChange={(event) => onChoice(name, { ...choice, typeCode: event.target.value })}
                >
                  {(lookups?.stoneTypes ?? []).map((type) => (
                    <option key={type.code} value={type.code}>{type.label}</option>
                  ))}
                </select>
                <Input placeholder="Карьер" value={choice.quarry} onChange={(event) => onChoice(name, { ...choice, quarry: event.target.value })} />
                <Input placeholder="Страна" value={choice.country} onChange={(event) => onChoice(name, { ...choice, country: event.target.value })} />
              </div>
            ) : null}
          </div>
        )
      })}
      <div className="text-xs">
        {lines.map((line, index) => (
          <div key={`${line.groupName}-${line.label}-${index}`} className="flex flex-wrap items-center gap-2 border-t border-border py-1">
            <span className="min-w-40">{line.groupName}</span>
            <span>{line.label}</span>
            <span>{formatOfferPrice(line.priceAmount, line.priceUnit)}</span>
            <select
              className="rounded-md border border-border bg-background px-2 py-1"
              value={line.kind}
              onChange={(event) => onKind(index, event.target.value as PromotionLine["kind"])}
            >
              <option value="tile">Плита</option>
              <option value="slab">Слэб</option>
              <option value="block">Блок</option>
            </select>
            {line.issue ? <span className="text-destructive">{line.issue}</span> : null}
          </div>
        ))}
      </div>
    </div>
  )
}
