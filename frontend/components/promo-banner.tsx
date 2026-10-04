"use client"

import { useId, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export const BANNER_TEMPLATES = [
  { id: "stone", label: "Камень" },
  { id: "slab", label: "Слэб" },
  { id: "quarry", label: "Карьер" },
  { id: "vein", label: "Прожилка" },
  { id: "ledger", label: "Карточка" },
  { id: "split", label: "Отбор" },
  { id: "band", label: "Полоса" },
  { id: "frame", label: "Рамка" },
  { id: "seal", label: "Печать" },
  { id: "quiet", label: "Тихий" },
] as const

export type BannerTemplateId = (typeof BANNER_TEMPLATES)[number]["id"]

const KICKERS: Record<BannerTemplateId, string> = {
  stone: "Специальное предложение",
  slab: "Фонд",
  quarry: "Партия",
  vein: "Редкость",
  ledger: "Срок",
  split: "Отбор",
  band: "Акция",
  frame: "Слэб",
  seal: "StoneTrail",
  quiet: "Предложение",
}

type PromoBannerProps = {
  className?: string
  instanceId?: string
  template?: BannerTemplateId
  title?: string
  description?: string
  note?: string
  buttonLabel?: string
  href?: string
  preview?: boolean
  onButtonClick?: () => void
}

export function PromoBanner({
  className,
  instanceId,
  template = "stone",
  title = "Зимняя подборка: граниты Северной Европы",
  description = "Специальные условия на партию износостойких гранитов для коммерческих объектов.",
  note = "Предложение действительно до 15 февраля 2026 года",
  buttonLabel = "Узнать детали",
  href,
  preview = false,
  onButtonClick,
}: PromoBannerProps) {
  const generatedId = useId().replace(/:/g, "")
  const uid = instanceId?.replace(/[^a-zA-Z0-9_-]/g, "") || generatedId
  const copy = (
    <BannerCopy
      template={template}
      title={title}
      description={description}
      note={note}
      buttonLabel={buttonLabel}
      href={href}
      preview={preview}
      onButtonClick={onButtonClick}
    />
  )

  if (template === "stone") {
    return (
      <StoneBanner uid={uid} className={className} preview={preview}>
        {copy}
      </StoneBanner>
    )
  }

  return (
    <article
      className={cn(
        "relative isolate overflow-hidden text-foreground",
        template === "band" ? "min-h-[168px]" : "min-h-[240px]",
        shellClass(template),
        className,
      )}
    >
      <TemplateMark template={template} />
      <div
        className={cn(
          "relative z-10 mx-auto flex w-full max-w-7xl items-center px-8 py-8 sm:px-12 lg:px-16",
          template === "band" ? "min-h-[168px] justify-center text-center" : "min-h-[240px]",
          template === "frame" && "px-12 py-12 sm:px-16",
        )}
      >
        {copy}
      </div>
    </article>
  )
}

function shellClass(template: BannerTemplateId) {
  if (template === "slab" || template === "band") return "bg-primary text-primary-foreground"
  return "bg-background"
}

function BannerCopy({
  template,
  title,
  description,
  note,
  buttonLabel,
  href,
  preview,
  onButtonClick,
}: {
  template: BannerTemplateId
  title: string
  description: string
  note: string
  buttonLabel: string
  href?: string
  preview: boolean
  onButtonClick?: () => void
}) {
  const inverted = template === "slab" || template === "band"
  const centered = template === "band"
  return (
    <div className={cn(centered ? "max-w-3xl" : "max-w-[820px]", template === "ledger" && "lg:max-w-none lg:pr-56")}>
      <p
        className={cn(
          "mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]",
          centered && "justify-center",
          inverted ? "text-accent" : "text-primary",
        )}
      >
        {template !== "quiet" ? <span className={cn("size-2 rounded-full", inverted ? "bg-accent" : "bg-primary")} /> : null}
        {KICKERS[template]}
      </p>
      <h2
        className={cn(
          "font-display text-3xl font-semibold tracking-tight sm:text-4xl sm:leading-[1.12]",
          inverted ? "text-primary-foreground" : "text-foreground",
        )}
      >
        {title}
      </h2>
      <p
        className={cn(
          "mt-3 max-w-3xl text-base leading-7 sm:text-lg",
          inverted ? "text-primary-foreground/80" : "text-muted-foreground",
          centered && "mx-auto",
        )}
      >
        {description}
      </p>
      {template === "ledger" ? (
        <p className="mt-4 inline-flex border border-border px-3 py-1.5 text-sm text-foreground">{note}</p>
      ) : (
        <p className={cn("mt-3 text-sm italic", inverted ? "text-primary-foreground/70" : "text-muted-foreground")}>{note}</p>
      )}
      <div className={cn("mt-6", centered ? "flex justify-center" : "lg:hidden")}>
        <BannerAction template={template} href={href} preview={preview} onButtonClick={onButtonClick} label={buttonLabel} />
      </div>
      {centered ? null : (
        <div className="absolute right-8 top-1/2 hidden -translate-y-1/2 lg:block">
          <BannerAction template={template} href={href} preview={preview} onButtonClick={onButtonClick} label={buttonLabel} />
        </div>
      )}
    </div>
  )
}

function BannerAction({
  template,
  href,
  preview,
  onButtonClick,
  label,
}: {
  template: BannerTemplateId
  href?: string
  preview: boolean
  onButtonClick?: () => void
  label: string
}) {
  const inverted = template === "slab" || template === "band"
  const className = cn(
    "inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    template === "quiet"
      ? "bg-transparent px-0 text-primary underline-offset-4 hover:underline"
      : inverted
        ? "bg-primary-foreground text-primary focus-visible:ring-primary-foreground"
        : "bg-primary text-primary-foreground focus-visible:ring-primary",
  )
  const content = (
    <>
      {label}
      <ArrowRight className="size-4" strokeWidth={1.8} />
    </>
  )
  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    )
  }
  if (preview) {
    return <span className={className}>{content}</span>
  }
  return (
    <button type="button" onClick={onButtonClick} className={className}>
      {content}
    </button>
  )
}

function StoneBanner({
  uid,
  className,
  preview,
  children,
}: {
  uid: string
  className?: string
  preview: boolean
  children: ReactNode
}) {
  const bannerRef = useRef<HTMLElement>(null)
  const pointerRef = useRef({ x: 0.5, y: 0.5 })
  const frameRef = useRef<number | null>(null)
  const [hovered, setHovered] = useState(false)
  const distortionId = `stone-liquid-${uid}`
  const glowId = `stone-glow-${uid}`
  const shapeId = `stone-shape-${uid}`

  const updatePointer = (event: PointerEvent<HTMLElement>) => {
    if (preview) return
    const element = bannerRef.current
    if (!element) return
    const rect = element.getBoundingClientRect()
    pointerRef.current = {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    }
    if (frameRef.current !== null) return
    frameRef.current = requestAnimationFrame(() => {
      const { x, y } = pointerRef.current
      element.style.setProperty("--pointer-x", `${x * 100}%`)
      element.style.setProperty("--pointer-y", `${y * 100}%`)
      frameRef.current = null
    })
  }

  return (
    <article
      ref={bannerRef}
      onPointerMove={updatePointer}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => {
        setHovered(false)
        bannerRef.current?.style.setProperty("--pointer-x", "72%")
        bannerRef.current?.style.setProperty("--pointer-y", "40%")
      }}
      className={cn("relative isolate min-h-[240px] overflow-hidden bg-background text-foreground", className)}
      style={{ "--pointer-x": "72%", "--pointer-y": "40%" } as CSSProperties}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(circle at var(--pointer-x) var(--pointer-y), var(--primary-soft), transparent 32%)",
        }}
      />
      <svg aria-hidden className="pointer-events-none absolute -right-4 -top-8 h-[320px] w-[420px] opacity-80" viewBox="0 0 430 330" fill="none">
        <defs>
          <filter id={distortionId} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.01 0.02" numOctaves="2" seed="8" />
            <feDisplacementMap in="SourceGraphic" scale={preview ? 4 : hovered ? 12 : 7} />
          </filter>
          <radialGradient id={glowId} cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="var(--background)" />
            <stop offset="55%" stopColor="var(--primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.45" />
          </radialGradient>
          <mask id={shapeId}>
            <rect width="430" height="330" fill="black" />
            <path
              d="M292 0h68l13 79c2 12 10 20 22 22l35 6v55l-35 6c-12 2-20 10-22 22l-13 140h-68l-13-140c-2-12-10-20-22-22l-35-6v-55l35-6c12-2 20-10 22-22L292 0Z"
              fill="white"
            />
            <circle cx="396" cy="238" r="40" fill="white" />
            <circle cx="396" cy="238" r="14" fill="black" />
          </mask>
        </defs>
        <g mask={`url(#${shapeId})`} filter={`url(#${distortionId})`}>
          <rect width="430" height="330" fill={`url(#${glowId})`} />
        </g>
      </svg>
      <div className="relative z-10 mx-auto flex min-h-[240px] w-full max-w-7xl items-center px-8 py-8 sm:px-12 lg:px-16">{children}</div>
    </article>
  )
}

function TemplateMark({ template }: { template: BannerTemplateId }) {
  if (template === "slab") {
    return <div aria-hidden className="absolute inset-y-0 left-0 w-2 bg-accent" />
  }
  if (template === "quarry") {
    return (
      <>
        <div aria-hidden className="absolute inset-y-0 left-0 w-3 bg-primary" />
        <div aria-hidden className="absolute bottom-6 right-10 hidden size-16 border border-primary/30 sm:block" />
      </>
    )
  }
  if (template === "vein") {
    return (
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1.5 bg-accent"
      />
    )
  }
  if (template === "split") {
    return (
      <svg aria-hidden className="pointer-events-none absolute right-8 top-1/2 hidden h-40 w-40 -translate-y-1/2 text-primary lg:block" viewBox="0 0 160 160" fill="none">
        <rect x="18" y="18" width="84" height="124" stroke="currentColor" strokeWidth="1.5" />
        <rect x="48" y="8" width="94" height="70" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="112" cy="112" r="22" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  }
  if (template === "frame") {
    return <div aria-hidden className="pointer-events-none absolute inset-3 border border-primary/25 sm:inset-4" />
  }
  if (template === "seal") {
    return (
      <div aria-hidden className="absolute right-10 top-1/2 hidden size-28 -translate-y-1/2 items-center justify-center rounded-full border border-accent text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-accent lg:flex">
        ST
      </div>
    )
  }
  if (template === "quiet") {
    return (
      <>
        <div aria-hidden className="absolute inset-x-8 top-6 h-px bg-border sm:inset-x-12" />
        <div aria-hidden className="absolute inset-x-8 bottom-6 h-px bg-border sm:inset-x-12" />
      </>
    )
  }
  return null
}
