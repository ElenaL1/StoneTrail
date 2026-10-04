"use client"

import { createContext, useContext } from "react"
import type { ActivePromotion } from "@/lib/types"

const PromoPresenceContext = createContext<ActivePromotion[]>([])

export function PromoPresenceProvider({
  initial,
  children,
}: {
  initial: ActivePromotion[]
  children: React.ReactNode
}) {
  return <PromoPresenceContext.Provider value={initial}>{children}</PromoPresenceContext.Provider>
}

export function useActivePromotions() {
  return useContext(PromoPresenceContext)
}

export function useHasBanner() {
  return useActivePromotions().length > 0
}
