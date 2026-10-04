"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { adminApi, type BlockEdit, type CatalogLookups, type ProductEdit, type ProductItemEdit } from "@/lib/admin/api"
import { catalogApi } from "@/lib/catalog/api-client"
import { ContentRequestError } from "@/lib/content-request"
import type { Material, Product, StoneBlock } from "@/lib/types"

type Tab = "stones" | "blocks" | "products"

const emptyStone = {
  name: "",
  stoneTypeCode: "",
  quarry: "",
  country: "",
  description: "",
}

export default function AdminCatalogPage() {
  const [tab, setTab] = useState<Tab>("stones")
  const [lookups, setLookups] = useState<CatalogLookups | null>(null)
  const [stones, setStones] = useState<Material[]>([])
  const [blocks, setBlocks] = useState<StoneBlock[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState("")
  const [stoneForm, setStoneForm] = useState(emptyStone)
  const [stoneSlug, setStoneSlug] = useState<string | null>(null)
  const [blockForm, setBlockForm] = useState({
    stoneSlug: "",
    description: "",
    expertNote: "",
    label: "",
    lengthMm: "",
    widthMm: "",
    heightMm: "",
    finishCode: "",
  })
  const [blockSlug, setBlockSlug] = useState<string | null>(null)
  const [blockRest, setBlockRest] = useState<Record<string, unknown>[]>([])
  const [productForm, setProductForm] = useState({
    name: "",
    stoneSlug: "",
    category: "slabs",
    description: "",
    priceType: "on_request",
    amount: "",
    label: "",
    finishCode: "",
  })
  const [productSlug, setProductSlug] = useState<string | null>(null)
  const [productBase, setProductBase] = useState<ProductEdit | null>(null)
  const [productRest, setProductRest] = useState<ProductItemEdit[]>([])

  const load = async () => {
    const [nextLookups, nextStones, nextBlocks, nextProducts] = await Promise.all([
      adminApi.lookups(),
      catalogApi.listStones(),
      catalogApi.listBlocks(),
      catalogApi.listProducts(),
    ])
    setLookups(nextLookups)
    setStones(nextStones)
    setBlocks(nextBlocks)
    setProducts(nextProducts)
    setStoneForm((current) => ({
      ...current,
      stoneTypeCode: current.stoneTypeCode || nextLookups.stoneTypes[0]?.code || "",
    }))
    setBlockForm((current) => ({
      ...current,
      finishCode: current.finishCode || nextLookups.finishes[0]?.code || "",
      stoneSlug: current.stoneSlug || nextStones[0]?.id || "",
    }))
    setProductForm((current) => ({
      ...current,
      finishCode: current.finishCode || nextLookups.finishes[0]?.code || "",
      stoneSlug: current.stoneSlug || nextStones[0]?.id || "",
    }))
  }

  useEffect(() => {
    void (async () => {
      try {
        await load()
        const params = new URLSearchParams(window.location.search)
        const stone = params.get("stone")
        const block = params.get("block")
        const product = params.get("product")
        if (stone) await editStone(stone)
        else if (block) await editBlock(block)
        else if (product) await editProduct(product)
      } catch (err) {
        setError(err instanceof ContentRequestError ? err.message : "Не удалось загрузить каталог.")
      }
    })()
  }, [])

  const fail = (err: unknown) => {
    setError(err instanceof ContentRequestError ? err.message : "Не удалось сохранить.")
  }

  const saveStone = async () => {
    setError("")
    try {
      await adminApi.saveStone(stoneSlug, stoneForm)
      setStoneSlug(null)
      setStoneForm({ ...emptyStone, stoneTypeCode: lookups?.stoneTypes[0]?.code || "" })
      await load()
    } catch (err) {
      fail(err)
    }
  }

  const editStone = async (slug: string) => {
    const stone = await adminApi.stoneEdit(slug)
    setStoneSlug(stone.slug)
    setStoneForm({
      name: stone.name,
      stoneTypeCode: stone.stoneTypeCode,
      quarry: stone.quarry,
      country: stone.country,
      description: stone.description,
    })
    setTab("stones")
  }

  const saveBlock = async () => {
    setError("")
    try {
      await adminApi.saveBlock(blockSlug, {
        stoneSlug: blockForm.stoneSlug,
        description: blockForm.description,
        expertNote: blockForm.expertNote,
        items: [
          ...(blockForm.label
            ? [
                {
                  label: blockForm.label,
                  status: "in_stock",
                  lengthMm: Number(blockForm.lengthMm) || null,
                  widthMm: Number(blockForm.widthMm) || null,
                  heightMm: Number(blockForm.heightMm) || null,
                  finishCode: blockForm.finishCode || null,
                },
              ]
            : []),
          ...blockRest,
        ],
      })
      setBlockSlug(null)
      await load()
    } catch (err) {
      fail(err)
    }
  }

  const editBlock = async (slug: string) => {
    const lot: BlockEdit = await adminApi.blockEdit(slug)
    const item = lot.items[0]
    setBlockSlug(lot.slug)
    setBlockRest(lot.items.slice(1).map((item) => ({ ...item })))
    setBlockForm({
      stoneSlug: lot.stoneSlug,
      description: lot.description,
      expertNote: lot.expertNote,
      label: item?.label ?? "",
      lengthMm: item?.lengthMm ? String(item.lengthMm) : "",
      widthMm: item?.widthMm ? String(item.widthMm) : "",
      heightMm: item?.heightMm ? String(item.heightMm) : "",
      finishCode: item?.finishCode ?? lookups?.finishes[0]?.code ?? "",
    })
    setTab("blocks")
  }

  const saveProduct = async () => {
    setError("")
    try {
      const { recordId: _recordId, items: existingItems, ...base } = productBase ?? {
        items: [] as ProductItemEdit[],
      }
      const first = existingItems[0]
      const items = productForm.label
        ? [
            {
              ...(first ?? {}),
              label: productForm.label,
              finishCode: productForm.finishCode,
              status: first?.status ?? "in_stock",
            },
            ...productRest,
          ]
        : productSlug
          ? undefined
          : []
      await adminApi.saveProduct(productSlug, {
        ...base,
        name: productForm.name,
        stoneSlug: productForm.stoneSlug,
        category: productForm.category,
        description: productForm.description,
        priceType: productForm.priceType,
        amount: productForm.priceType === "fixed" && productForm.amount ? productForm.amount : null,
        ...(items === undefined ? {} : { items }),
      })
      setProductSlug(null)
      setProductBase(null)
      setProductRest([])
      await load()
    } catch (err) {
      fail(err)
    }
  }

  const editProduct = async (slug: string) => {
    const product = await adminApi.productEdit(slug)
    const item = product.items[0]
    setProductSlug(product.slug)
    setProductBase(product)
    setProductRest(product.items.slice(1))
    setProductForm({
      name: product.name,
      stoneSlug: product.stoneSlug,
      category: product.category,
      description: product.description,
      priceType: product.priceType,
      amount: product.amount ?? "",
      label: item?.label ?? "",
      finishCode: item?.finishCode ?? lookups?.finishes[0]?.code ?? "",
    })
    setTab("products")
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex gap-2">
        {(
          [
            ["stones", "Камни"],
            ["blocks", "Блоки"],
            ["products", "Изделия"],
          ] as const
        ).map(([id, label]) => (
          <Button key={id} variant={tab === id ? "default" : "outline"} onClick={() => setTab(id)}>
            {label}
          </Button>
        ))}
      </div>

      {tab === "stones" ? (
        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <form
            className="space-y-3 rounded-2xl border border-border p-4"
            onSubmit={(event) => {
              event.preventDefault()
              void saveStone()
            }}
          >
            <h2 className="font-semibold">{stoneSlug ? "Изменить камень" : "Новый камень"}</h2>
            <Input placeholder="Название" value={stoneForm.name} onChange={(event) => setStoneForm({ ...stoneForm, name: event.target.value })} required />
            <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={stoneForm.stoneTypeCode} onChange={(event) => setStoneForm({ ...stoneForm, stoneTypeCode: event.target.value })}>
              {(lookups?.stoneTypes ?? []).map((type) => (
                <option key={type.code} value={type.code}>{type.label}</option>
              ))}
            </select>
            <Input placeholder="Карьер" value={stoneForm.quarry} onChange={(event) => setStoneForm({ ...stoneForm, quarry: event.target.value })} required />
            <Input placeholder="Страна" value={stoneForm.country} onChange={(event) => setStoneForm({ ...stoneForm, country: event.target.value })} required />
            <Textarea placeholder="Описание" value={stoneForm.description} onChange={(event) => setStoneForm({ ...stoneForm, description: event.target.value })} />
            <Button type="submit">Сохранить</Button>
          </form>
          <ul className="space-y-2">
            {stones.map((stone) => (
              <li key={stone.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                <span>{stone.name}</span>
                <span className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => void editStone(stone.id)}>Изменить</Button>
                  <Button variant="outline" size="sm" onClick={() => void adminApi.deleteStone(stone.id).then(load).catch(fail)}>Удалить</Button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "blocks" ? (
        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <form className="space-y-3 rounded-2xl border border-border p-4" onSubmit={(event) => { event.preventDefault(); void saveBlock() }}>
            <h2 className="font-semibold">{blockSlug ? "Изменить партию" : "Новая партия"}</h2>
            <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={blockForm.stoneSlug} onChange={(event) => setBlockForm({ ...blockForm, stoneSlug: event.target.value })}>
              {stones.map((stone) => <option key={stone.id} value={stone.id}>{stone.name}</option>)}
            </select>
            <Textarea placeholder="Описание" value={blockForm.description} onChange={(event) => setBlockForm({ ...blockForm, description: event.target.value })} />
            <Textarea placeholder="Заметка эксперта" value={blockForm.expertNote} onChange={(event) => setBlockForm({ ...blockForm, expertNote: event.target.value })} />
            <Input placeholder="Метка блока" value={blockForm.label} onChange={(event) => setBlockForm({ ...blockForm, label: event.target.value })} />
            <Input placeholder="Длина, мм" value={blockForm.lengthMm} onChange={(event) => setBlockForm({ ...blockForm, lengthMm: event.target.value })} />
            <Input placeholder="Ширина, мм" value={blockForm.widthMm} onChange={(event) => setBlockForm({ ...blockForm, widthMm: event.target.value })} />
            <Input placeholder="Высота, мм" value={blockForm.heightMm} onChange={(event) => setBlockForm({ ...blockForm, heightMm: event.target.value })} />
            <Button type="submit">Сохранить</Button>
          </form>
          <ul className="space-y-2">
            {blocks.map((lot) => (
              <li key={lot.slug} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                <span>{lot.stoneName}</span>
                <span className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => void editBlock(lot.slug)}>Изменить</Button>
                  <Button variant="outline" size="sm" onClick={() => void adminApi.deleteBlock(lot.slug).then(load).catch(fail)}>Удалить</Button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "products" ? (
        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <form className="space-y-3 rounded-2xl border border-border p-4" onSubmit={(event) => { event.preventDefault(); void saveProduct() }}>
            <h2 className="font-semibold">{productSlug ? "Изменить изделие" : "Новое изделие"}</h2>
            <Input placeholder="Название" value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} required />
            <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={productForm.stoneSlug} onChange={(event) => setProductForm({ ...productForm, stoneSlug: event.target.value })}>
              {stones.map((stone) => <option key={stone.id} value={stone.id}>{stone.name}</option>)}
            </select>
            <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })}>
              <option value="slabs">Слэбы</option>
              <option value="blanks">Заготовки</option>
              <option value="tiles">Плитка</option>
              <option value="paving">Брусчатка</option>
              {productForm.category === "custom" ? <option value="custom">Индивидуальное</option> : null}
            </select>
            <Textarea placeholder="Описание" value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} required />
            <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={productForm.priceType} onChange={(event) => setProductForm({ ...productForm, priceType: event.target.value })}>
              <option value="on_request">Цена по запросу</option>
              <option value="fixed">Фиксированная</option>
            </select>
            {productForm.priceType === "fixed" ? (
              <Input placeholder="Сумма" value={productForm.amount} onChange={(event) => setProductForm({ ...productForm, amount: event.target.value })} />
            ) : null}
            <Input placeholder="Метка позиции" value={productForm.label} onChange={(event) => setProductForm({ ...productForm, label: event.target.value })} />
            <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={productForm.finishCode} onChange={(event) => setProductForm({ ...productForm, finishCode: event.target.value })}>
              {(lookups?.finishes ?? []).map((finish) => <option key={finish.code} value={finish.code}>{finish.label}</option>)}
            </select>
            <Button type="submit">Сохранить</Button>
          </form>
          <ul className="space-y-2">
            {products.map((product) => (
              <li key={product.slug} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                <span>{product.name}</span>
                <span className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => void editProduct(product.slug)}>Изменить</Button>
                  <Button variant="outline" size="sm" onClick={() => void adminApi.deleteProduct(product.slug).then(load).catch(fail)}>Удалить</Button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
