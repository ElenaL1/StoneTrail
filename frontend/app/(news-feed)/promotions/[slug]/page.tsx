"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Calendar, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FeedLikeButton } from "@/components/news/feed-like-button"
import { promotionsApi } from "@/lib/feed/api-client"
import { formatFeedDate } from "@/lib/feed/format"
import { isNotFound } from "@/lib/content-request"
import { formatOfferPrice } from "@/lib/promotions/offer-price"
import type { Promotion, PromotionLine } from "@/lib/types"

export default function PromotionDetailPage() {
  const params = useParams<{ slug: string }>()
  const [item, setItem] = useState<Promotion | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    if (!params.slug) return
    void promotionsApi
      .get(params.slug)
      .then(setItem)
      .catch((error: unknown) => {
        if (isNotFound(error)) setMissing(true)
      })
  }, [params.slug])

  if (missing) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-xl text-muted-foreground">Предложение не найдено</p>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-24 lg:px-8">
      <Link href="/news" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
        <ArrowLeft className="size-4" />
        Назад к новостям
      </Link>
      <article className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-primary/30 bg-[var(--primary-soft)] px-3 py-1 text-sm text-primary">
              Специальное предложение
            </Badge>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="size-4" />
              {formatFeedDate(item.createdAt)}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">{item.title}</h1>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <p className="text-lg leading-relaxed text-muted-foreground">{item.description}</p>
            <FeedLikeButton slug={item.slug} kind="promotion" liked={item.liked} count={item.likesCount} />
          </div>
        </div>
        <div className="relative space-y-6 rounded-3xl border border-border bg-card p-8 shadow-sm">
          <div className="absolute -top-3 left-8 flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
            <Sparkles className="size-3" />
            ДЕТАЛИ ПРЕДЛОЖЕНИЯ
          </div>
          <div className="whitespace-pre-wrap text-lg leading-relaxed text-foreground">{item.content}</div>
          {item.sheetImageUrl ? (
            <Image
              src={item.sheetImageUrl}
              alt={item.title}
              width={1200}
              height={800}
              className="h-auto w-full rounded-2xl border border-border"
              unoptimized
            />
          ) : null}
          <OfferTable lines={item.lines ?? []} />
          {item.offerNote ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{item.offerNote}</p>
          ) : null}
          <div className="flex flex-col justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
            <p className="text-sm italic text-muted-foreground">Срок действия: до {formatFeedDate(item.expiresAt)}</p>
            <div className="flex flex-wrap gap-2">
              {item.sheetPdfUrl ? (
                <Button asChild variant="outline">
                  <a href={item.sheetPdfUrl} target="_blank" rel="noreferrer">Скачать PDF</a>
                </Button>
              ) : null}
              <Button asChild className="gap-2 px-8">
                <Link href="/contacts">{item.inquiryLabel || "Запросить"}</Link>
              </Button>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}

function OfferTable({ lines }: { lines: PromotionLine[] }) {
  if (lines.length === 0) return null
  const groups = new Map<string, PromotionLine[]>()
  for (const line of lines) {
    const bucket = groups.get(line.groupName) ?? []
    bucket.push(line)
    groups.set(line.groupName, bucket)
  }
  return (
    <div className="space-y-6 overflow-x-auto">
      {[...groups.entries()].map(([name, rows]) => (
        <table key={name} className="w-full min-w-[640px] border-collapse text-left text-sm">
          <caption className="mb-2 text-left font-display text-lg font-semibold text-foreground">
            {name}
          </caption>
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
              <th className="py-2 pr-3 font-semibold">Размер</th>
              <th className="py-2 pr-3 font-semibold">Толщина</th>
              <th className="py-2 pr-3 font-semibold">Фактура</th>
              <th className="py-2 pr-3 font-semibold">м²</th>
              <th className="py-2 font-semibold">Цена</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.sortOrder}-${row.label}`} className="border-b border-border/60">
                <td className="py-2 pr-3 font-medium text-foreground">{row.label}</td>
                <td className="py-2 pr-3 text-foreground">
                  {row.thicknessMm ? `${row.thicknessMm} мм` : row.heightMm ? `${row.heightMm} мм` : "—"}
                </td>
                <td className="py-2 pr-3 text-foreground">{row.finish || "—"}</td>
                <td className="py-2 pr-3 text-foreground">{row.areaM2 ?? "—"}</td>
                <td className="py-2 text-foreground">{formatOfferPrice(row.priceAmount, row.priceUnit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </div>
  )
}
