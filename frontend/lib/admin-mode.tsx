"use client"

import { createContext, useContext, useEffect, useState } from "react"

const STORAGE_KEY = "stonetrail-admin-mode"

type AdminModeValue = {
  enabled: boolean
  toggle: () => void
}

const AdminModeContext = createContext<AdminModeValue | null>(null)

export function AdminModeProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    setEnabled(window.localStorage.getItem(STORAGE_KEY) === "1")
  }, [])

  const toggle = () => {
    setEnabled((current) => {
      const next = !current
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0")
      return next
    })
  }

  return (
    <AdminModeContext.Provider value={{ enabled, toggle }}>
      {children}
    </AdminModeContext.Provider>
  )
}

export function useAdminMode(): AdminModeValue {
  return useContext(AdminModeContext) ?? { enabled: false, toggle: () => undefined }
}
