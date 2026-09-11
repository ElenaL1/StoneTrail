"use client"

import { useId, useRef, useState, type CSSProperties, type PointerEvent } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

type PromoBannerProps = {
  className?: string
  instanceId?: string
  title?: string
  description?: string
  note?: string
  buttonLabel?: string
  href?: string
  onButtonClick?: () => void
}

export function PromoBanner({
  className,
  instanceId,
  title = "Зимняя подборка: Граниты Северной Европы",
  description =
    "Специальные условия на партию износостойких гранитов для коммерческих объектов. Гарантированная однородность цвета всей партии.",
  note = "Предложение действительно до 15 февраля 2025 года",
  buttonLabel = "Узнать детали",
  href,
  onButtonClick,
}: PromoBannerProps) {
  const generatedId = useId().replace(/:/g, "")
  const uid = instanceId?.replace(/[^a-zA-Z0-9_-]/g, "") || generatedId
  const distortionId = `stone-liquid-distortion-${uid}`
  const glowId = `stone-glow-${uid}`
  const shapeId = `stone-shape-${uid}`

  const bannerRef = useRef<HTMLDivElement>(null)
  const pointerRef = useRef({ x: 0.5, y: 0.5 })
  const frameRef = useRef<number | null>(null)
  const [isHovered, setIsHovered] = useState(false)

  const updatePointer = (event: PointerEvent<HTMLDivElement>) => {
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

  const resetPointer = () => {
    const element = bannerRef.current
    if (!element) return

    element.style.setProperty("--pointer-x", "50%")
    element.style.setProperty("--pointer-y", "50%")
  }

  const actionClassName =
    "inline-flex items-center gap-3 rounded-xl bg-[#245547] px-6 py-3.5 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245547] focus-visible:ring-offset-4"
  const desktopActionClassName =
    "absolute right-8 top-1/2 hidden -translate-y-1/2 items-center gap-4 rounded-xl bg-[#245547] px-7 py-4 text-base font-semibold text-white transition-all duration-500 hover:-translate-y-[calc(50%+2px)] hover:bg-[#1d493d] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245547] focus-visible:ring-offset-4 lg:flex"

  const actionContent = (
    <>
      {buttonLabel}
      <ArrowRight
        className="size-5 transition-transform duration-500 group-hover:translate-x-1"
        strokeWidth={1.8}
      />
    </>
  )

  const desktopAction = href ? (
    <Link href={href} className={desktopActionClassName}>
      {actionContent}
    </Link>
  ) : (
    <button type="button" onClick={onButtonClick} className={desktopActionClassName}>
      {actionContent}
    </button>
  )

  const mobileAction = href ? (
    <Link href={href} className={actionClassName}>
      {buttonLabel}
      <ArrowRight className="size-4" strokeWidth={1.8} />
    </Link>
  ) : (
    <button type="button" onClick={onButtonClick} className={actionClassName}>
      {buttonLabel}
      <ArrowRight className="size-4" strokeWidth={1.8} />
    </button>
  )

  return (
    <div
      ref={bannerRef}
      onPointerMove={updatePointer}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => {
        setIsHovered(false)
        resetPointer()
      }}
      className={cn(
        "group relative isolate min-h-[264px] overflow-hidden bg-[#f2f0ea] text-[#111c1a]",
        className,
      )}
      style={{
        "--pointer-x": "50%",
        "--pointer-y": "50%",
      } as CSSProperties}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 opacity-50 transition-opacity duration-700",
          isHovered && "opacity-80",
        )}
        style={{
          background:
            "radial-gradient(circle at var(--pointer-x) var(--pointer-y), rgba(255,255,255,.72), transparent 30%)",
        }}
      />

      <svg
        aria-hidden="true"
        className="pointer-events-none absolute right-[-20px] top-[-34px] -z-[5] h-[330px] w-[430px] opacity-80"
        viewBox="0 0 430 330"
        fill="none"
      >
        <defs>
          <filter
            id={distortionId}
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.008 0.018"
              numOctaves="2"
              seed="8"
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                values="0.008 0.018;0.012 0.014;0.008 0.018"
                dur="12s"
                repeatCount="indefinite"
              />
            </feTurbulence>

            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={isHovered ? 12 : 7}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          <radialGradient id={glowId} cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity=".65" />
            <stop offset="55%" stopColor="#dfe3dc" stopOpacity=".5" />
            <stop offset="100%" stopColor="#cfd5cd" stopOpacity=".72" />
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

        <g
          mask={`url(#${shapeId})`}
          filter={`url(#${distortionId})`}
          className="origin-center transition-transform duration-[1400ms] ease-out"
          style={{
            transform: `translate3d(calc((var(--pointer-x) - 50%) * 0.10), calc((var(--pointer-y) - 50%) * 0.08), 0)`,
          }}
        >
          <rect width="430" height="330" fill={`url(#${glowId})`} />
          <circle cx="340" cy="85" r="125" fill="white" fillOpacity=".18" />
          <circle cx="420" cy="160" r="90" fill="#bfc8c0" fillOpacity=".18" />
        </g>
      </svg>

      <div className="relative z-10 mx-auto flex min-h-[264px] w-full max-w-7xl items-center px-8 py-10 sm:px-12 lg:px-16">
        <div className="max-w-[850px]">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#245547]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#245547]" />
            Специальное предложение
          </div>

          <h2 className="max-w-[900px] text-3xl font-semibold tracking-[-0.035em] text-[#111c1a] sm:text-[38px] sm:leading-[1.12]">
            {title}
          </h2>

          <p className="mt-3 max-w-[820px] text-base leading-7 text-[#64706d] sm:text-[19px] sm:leading-8">
            {description}
          </p>

          <p className="mt-3 text-sm italic text-[#7d8582]">{note}</p>
        </div>

        {desktopAction}
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-8 pb-8 sm:px-12 lg:hidden">
        {mobileAction}
      </div>
    </div>
  )
}
