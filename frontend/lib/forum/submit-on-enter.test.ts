import { describe, expect, test } from "vitest"
import type { KeyboardEvent } from "react"
import { shouldSubmitOnEnter } from "@/lib/forum/submit-on-enter"

function enter(overrides: {
  shiftKey?: boolean
  altKey?: boolean
  ctrlKey?: boolean
  metaKey?: boolean
  isComposing?: boolean
  selectionStart?: number
  selectionEnd?: number
  value?: string
  key?: string
} = {}): KeyboardEvent<HTMLTextAreaElement> {
  const value = overrides.value ?? "абв"
  return {
    key: overrides.key ?? "Enter",
    shiftKey: overrides.shiftKey ?? false,
    altKey: overrides.altKey ?? false,
    ctrlKey: overrides.ctrlKey ?? false,
    metaKey: overrides.metaKey ?? false,
    nativeEvent: { isComposing: overrides.isComposing ?? false },
    currentTarget: {
      selectionStart: overrides.selectionStart ?? value.length,
      selectionEnd: overrides.selectionEnd ?? value.length,
      value,
    },
  } as KeyboardEvent<HTMLTextAreaElement>
}

describe("shouldSubmitOnEnter", () => {
  test("Enter в конце текста отправляет", () => {
    expect(shouldSubmitOnEnter(enter())).toBe(true)
  })

  test("Enter в середине и при выделении оставляет строку", () => {
    expect(shouldSubmitOnEnter(enter({ selectionStart: 1 }))).toBe(false)
    expect(shouldSubmitOnEnter(enter({ selectionStart: 0, selectionEnd: 2 }))).toBe(false)
  })

  test("Shift+Enter и набор через IME не отправляют", () => {
    expect(shouldSubmitOnEnter(enter({ shiftKey: true }))).toBe(false)
    expect(shouldSubmitOnEnter(enter({ isComposing: true }))).toBe(false)
    expect(shouldSubmitOnEnter(enter({ key: "a" }))).toBe(false)
  })

  test("Ctrl+Enter и Cmd+Enter отправляют из середины", () => {
    expect(shouldSubmitOnEnter(enter({ ctrlKey: true, selectionStart: 1 }))).toBe(true)
    expect(shouldSubmitOnEnter(enter({ metaKey: true, selectionStart: 0 }))).toBe(true)
  })
})
