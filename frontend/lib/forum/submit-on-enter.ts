import type { KeyboardEvent } from "react"

export function shouldSubmitOnEnter(event: KeyboardEvent<HTMLTextAreaElement>): boolean {
  if (event.key !== "Enter" || event.nativeEvent.isComposing) return false
  if (event.shiftKey || event.altKey) return false
  if (event.ctrlKey || event.metaKey) return true
  const { selectionStart, selectionEnd, value } = event.currentTarget
  return selectionStart === selectionEnd && selectionStart === value.length
}
