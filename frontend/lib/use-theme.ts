"use client"

import { useCallback, useEffect, useState } from "react"

type Theme = "light" | "dark"

const STORAGE_KEY = "stonetrail-theme"

function getAppliedTheme(): Theme {
  if (typeof document === "undefined") return "light"
  if (document.documentElement.classList.contains("dark")) return "dark"
  if (typeof window.matchMedia !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark"
  }
  return "light"
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light")

  useEffect(() => {
    setTheme(getAppliedTheme())
  }, [])

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
    apply(getAppliedTheme() === "dark" ? "light" : "dark")
  }, [apply])

  return { theme, isDark: theme === "dark", toggle }
}
