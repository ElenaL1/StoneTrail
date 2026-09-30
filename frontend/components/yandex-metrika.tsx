"use client"

import { useEffect, useRef } from "react"
import Script from "next/script"
import { usePathname, useSearchParams } from "next/navigation"

const COUNTER_ID = 113104485
const TAG_SRC = `https://mc.yandex.ru/metrika/tag.js?id=${COUNTER_ID}`

type YmArgs = IArguments | unknown[]

type YmFunction = {
  (counterId: number, method: string, ...args: unknown[]): void
  a?: YmArgs[]
  l?: number
}

declare global {
  interface Window {
    ym?: YmFunction
  }
}

function ensureYmQueue() {
  if (window.ym) return
  const queued = function ymQueue(this: unknown, ...args: unknown[]) {
    ;(queued.a = queued.a || []).push(args)
  } as YmFunction
  queued.l = Date.now()
  window.ym = queued
}

function pageUrl(pathname: string, search: string) {
  const query = search ? `?${search}` : ""
  return `${window.location.origin}${pathname}${query}`
}

export function YandexMetrika() {
  const enabled = process.env.NODE_ENV === "production"
  const pathname = usePathname()
  const search = useSearchParams().toString()
  const started = useRef(false)

  useEffect(() => {
    if (!enabled) return
    ensureYmQueue()
    const ym = window.ym
    if (!ym) return
    if (!started.current) {
      ym(COUNTER_ID, "init", {
        ssr: true,
        webvisor: true,
        clickmap: true,
        ecommerce: "dataLayer",
        accurateTrackBounce: true,
        trackLinks: true,
        defer: true,
      })
      started.current = true
    }
    const url = pageUrl(pathname, search)
    const frame = requestAnimationFrame(() => {
      window.ym?.(COUNTER_ID, "hit", url, { title: document.title })
    })
    return () => cancelAnimationFrame(frame)
  }, [enabled, pathname, search])

  if (!enabled) return null

  return (
    <>
      <Script id="yandex-metrika" src={TAG_SRC} strategy="afterInteractive" />
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${COUNTER_ID}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
    </>
  )
}
