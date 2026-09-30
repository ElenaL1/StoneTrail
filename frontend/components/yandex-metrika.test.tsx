import { render } from "@testing-library/react"
import { beforeEach, describe, expect, test, vi } from "vitest"

const nav = vi.hoisted(() => ({ pathname: "/about", search: "" }))

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(nav.search),
}))

vi.mock("next/script", () => ({
  default: ({ src, id }: { src?: string; id?: string }) => (
    // Mock only. A real script tag is not inserted into the page.
    // eslint-disable-next-line @next/next/no-sync-scripts
    <script id={id} src={src} />
  ),
}))

import { YandexMetrika } from "@/components/yandex-metrika"

const ym = vi.fn()
const frames = new Map<number, FrameRequestCallback>()
let frameId = 0

function flushFrames() {
  const pending = [...frames.values()]
  frames.clear()
  for (const callback of pending) callback(0)
}

function hitCalls() {
  return ym.mock.calls.filter((call) => call[1] === "hit")
}

describe("YandexMetrika", () => {
  beforeEach(() => {
    nav.pathname = "/about"
    nav.search = ""
    frameId = 0
    frames.clear()
    ym.mockClear()
    document.title = "О сайте"
    window.ym = ym
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frameId += 1
      frames.set(frameId, callback)
      return frameId
    })
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      frames.delete(id)
    })
  })

  test("в production init с defer идёт раньше первого hit", () => {
    vi.stubEnv("NODE_ENV", "production")
    document.title = "Старый заголовок"
    render(<YandexMetrika />)

    expect(ym).toHaveBeenCalledTimes(1)
    expect(ym).toHaveBeenCalledWith(
      113104485,
      "init",
      expect.objectContaining({ defer: true, webvisor: true, ecommerce: "dataLayer" }),
    )
    expect(hitCalls()).toHaveLength(0)
    expect(document.querySelector("script[src*='mc.yandex.ru/metrika/tag.js?id=113104485']")).toBeTruthy()

    document.title = "О сайте"
    flushFrames()

    expect(hitCalls()).toEqual([
      [113104485, "hit", `${window.location.origin}/about`, { title: "О сайте" }],
    ])
  })

  test("смена пути и query отправляет новый hit с актуальным title", () => {
    vi.stubEnv("NODE_ENV", "production")
    const view = render(<YandexMetrika />)
    flushFrames()

    nav.pathname = "/catalog"
    document.title = "Каталог"
    view.rerender(<YandexMetrika />)
    flushFrames()

    nav.pathname = "/catalog"
    nav.search = "page=2"
    document.title = "Каталог, страница 2"
    view.rerender(<YandexMetrika />)
    flushFrames()

    const hits = hitCalls()
    expect(hits.map((call) => call[2])).toEqual([
      `${window.location.origin}/about`,
      `${window.location.origin}/catalog`,
      `${window.location.origin}/catalog?page=2`,
    ])
    expect(hits[2][3]).toEqual({ title: "Каталог, страница 2" })
  })

  test("в development не грузит tag.js и не вызывает init или hit", () => {
    vi.stubEnv("NODE_ENV", "development")
    render(<YandexMetrika />)
    flushFrames()

    expect(ym).not.toHaveBeenCalled()
    expect(document.querySelector("script[src*='mc.yandex.ru']")).toBeNull()
  })
})
