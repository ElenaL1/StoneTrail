"use client"

import { useEffect } from "react"

export function ClientErrorListener() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return
    const onRejection = (event: PromiseRejectionEvent) => {
      console.error(event.reason)
    }
    window.addEventListener("unhandledrejection", onRejection)
    return () => window.removeEventListener("unhandledrejection", onRejection)
  }, [])
  return null
}
