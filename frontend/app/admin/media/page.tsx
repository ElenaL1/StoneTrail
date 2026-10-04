"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { adminApi, type MediaItem } from "@/lib/admin/api"
import { uploadToPresignedUrl } from "@/lib/media/upload"
import { catalogApi } from "@/lib/catalog/api-client"
import { ContentRequestError } from "@/lib/content-request"
import type { Material, Product, StoneBlock } from "@/lib/types"

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [stones, setStones] = useState<Material[]>([])
  const [blocks, setBlocks] = useState<StoneBlock[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [alt, setAlt] = useState("")
  const [ownerType, setOwnerType] = useState("stone")
  const [ownerSlug, setOwnerSlug] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const load = async () => {
    const [media, nextStones, nextBlocks, nextProducts] = await Promise.all([
      adminApi.listMedia(),
      catalogApi.listStones(),
      catalogApi.listBlocks(),
      catalogApi.listProducts(),
    ])
    setItems(media)
    setStones(nextStones)
    setBlocks(nextBlocks)
    setProducts(nextProducts)
    setOwnerSlug((current) => current || nextStones[0]?.id || "")
  }

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof ContentRequestError ? err.message : "Не удалось загрузить медиатеку.")
    })
  }, [])

  const upload = async (file: File) => {
    setError("")
    setNotice("")
    if (!alt.trim()) {
      setError("Укажите текстовое описание изображения.")
      return
    }
    const presign = await adminApi.presign(file.type, file.size)
    await uploadToPresignedUrl(presign.uploadUrl, file, presign.headers)
    await adminApi.confirmMedia({
      storageKey: presign.storageKey,
      alt: alt.trim(),
      contentType: file.type,
      sizeBytes: file.size,
    })
    setAlt("")
    setNotice("Изображение сохранено.")
    await load()
  }

  const owners =
    ownerType === "block_lot" ? blocks.map((item) => ({ id: item.slug, label: item.stoneName }))
    : ownerType === "product" ? products.map((item) => ({ id: item.slug, label: item.name }))
    : stones.map((item) => ({ id: item.id, label: item.name }))

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {notice ? <p className="text-sm text-foreground">{notice}</p> : null}
      <form
        className="space-y-3 rounded-2xl border border-border p-4"
        onSubmit={(event) => {
          event.preventDefault()
          const input = event.currentTarget.elements.namedItem("file") as HTMLInputElement
          const file = input.files?.[0]
          if (!file) return
          void upload(file).catch((err: unknown) => {
            setError(err instanceof ContentRequestError ? err.message : "Не удалось загрузить файл.")
          })
        }}
      >
        <h2 className="font-semibold">Новое изображение</h2>
        <Input placeholder="Описание для слабовидящих" value={alt} onChange={(event) => setAlt(event.target.value)} required />
        <Input name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
        <Button type="submit">Загрузить</Button>
      </form>
      <div className="flex flex-wrap gap-2">
        <select className="rounded-md border border-border bg-background px-3 py-2 text-sm" value={ownerType} onChange={(event) => { setOwnerType(event.target.value); setOwnerSlug("") }}>
          <option value="stone">Камень</option>
          <option value="block_lot">Партия блоков</option>
          <option value="product">Изделие</option>
        </select>
        <select className="rounded-md border border-border bg-background px-3 py-2 text-sm" value={ownerSlug} onChange={(event) => setOwnerSlug(event.target.value)}>
          {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.label}</option>)}
        </select>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.id} className="overflow-hidden rounded-2xl border border-border">
            <img src={item.publicUrl} alt={item.alt} className="aspect-video w-full object-cover" />
            <div className="space-y-2 p-4">
              <p className="text-sm">{item.alt}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void adminApi.linkMedia(item.id, { ownerType, ownerSlug, isPrimary: true }).then(() => setNotice("Привязано.")).catch((err: unknown) => setError(err instanceof ContentRequestError ? err.message : "Не удалось привязать."))}
                >
                  Сделать обложкой
                </Button>
                <Button size="sm" variant="outline" onClick={() => void adminApi.deleteMedia(item.id).then(load)}>
                  Удалить
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
