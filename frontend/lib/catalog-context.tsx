"use client"

import React, { createContext, useContext, useState } from "react"
import { Material } from "@/lib/mock-data"

type CatalogContextType = {
  selection: Material[]
  addToSelection: (material: Material) => void
  removeFromSelection: (id: string) => void
  clearSelection: () => void
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined)

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [selection, setSelection] = useState<Material[]>([])

  const addToSelection = (material: Material) => {
    setSelection((prev) => {
      if (prev.find((m) => m.id === material.id)) return prev
      return [...prev, material]
    })
  }

  const removeFromSelection = (id: string) => {
    setSelection((prev) => prev.filter((m) => m.id !== id))
  }

  const clearSelection = () => {
    setSelection([])
  }

  return (
    <CatalogContext.Provider value={{ selection, addToSelection, removeFromSelection, clearSelection }}>
      {children}
    </CatalogContext.Provider>
  )
}

export function useCatalog() {
  const context = useContext(CatalogContext)
  if (context === undefined) {
    throw new Error("useCatalog must be used within a CatalogProvider")
  }
  return context
}