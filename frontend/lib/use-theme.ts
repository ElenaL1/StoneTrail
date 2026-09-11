"use client"

import { useCallback, useState } from "react"

type Theme = "light" | "dark"

const STORAGE_KEY = "stonetrail-theme"

// The <html> element never explicitly carries .light/.dark on first paint —
// the browser falls back to prefers-color-scheme. Read the applied class and
// default to the system preference so the first render matches what's shown.
function getInitialTheme(): Theme {
  if (typeof document === "undefined") return "light"
  if (document.documentElement.classList.contains("dark")) return "dark"
  if (typeof window.matchMedia !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark"
  }
  return "light"
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  const apply = useCallback((next: Theme) => {
    const root = document.documentElement
    root.classList.toggle("dark", next === "dark")
    root.classList.toggle("light", next === "light")
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore storage errors (e.g. private mode)
    }
    setTheme(next)
  }, [])

  const toggle = useCallback(() => {
    const current = getInitialTheme()
    apply(current === "dark" ? "light" : "dark")
  }, [apply])

  return { theme, isDark: theme === "dark", toggle }
}
