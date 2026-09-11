"use client"

import React, { useMemo, useState } from "react"
import { featuredMaterials } from "@/lib/mock-data"
import { MaterialCard } from "@/components/material-card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Package, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { arePromotionsEnabled } from "@/lib/promo-utils"
import { stoneOrigin } from "@/lib/stone-inventory"

export default function CatalogPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [originFilter, setOriginFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")
  const isBannerEnabled = arePromotionsEnabled()

  const origins = useMemo(
    () => Array.from(new Set(featuredMaterials.map((m) => stoneOrigin(m)))),
    [],
  )
  const types = Array.from(new Set(featuredMaterials.map((m) => m.type)))
  const locations = Array.from(new Set(featuredMaterials.map((m) => m.location)))

  const hasActiveFilters =
    searchQuery.trim() !== "" || typeFilter !== "all" || originFilter !== "all" || locationFilter !== "all"

  function resetFilters() {
    setSearchQuery("")
    setTypeFilter("all")
    setOriginFilter("all")
    setLocationFilter("all")
  }

  const filteredMaterials = useMemo(() => {
    return featuredMaterials.filter((m) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        m.name.toLowerCase().includes(q) ||
        m.type.toLowerCase().includes(q) ||
        m.quarry.toLowerCase().includes(q) ||
        m.country.toLowerCase().includes(q)
      const matchesType = typeFilter === "all" || m.type === typeFilter
      const matchesOrigin = originFilter === "all" || stoneOrigin(m) === originFilter
      const matchesLocation = locationFilter === "all" || m.location === locationFilter
      return matchesSearch && matchesType && matchesOrigin && matchesLocation
    })
  }, [searchQuery, typeFilter, originFilter, locationFilter])

  return (
    <div className={cn("min-h-screen py-24 px-5 lg:px-8", !isBannerEnabled ? "bg-muted/30" : "bg-background")}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Каталог камня
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Эксклюзивный фонд камня: блоки, слэбы, плитка и изделия. Выберите сорт и перейдите к нужному формату.
          </p>
        </div>

        <div className="relative mb-12">
          <div className="absolute inset-0 rounded-2xl border bg-secondary/30 backdrop-blur-sm" aria-hidden="true" />
          <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end p-6">
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Поиск</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Название, тип или месторождение..."
                  className="pl-10 bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Тип</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Все типы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  {types.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Месторождение</label>
              <Select value={originFilter} onValueChange={setOriginFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Любое" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Любое</SelectItem>
                  {origins.map((origin) => (
                    <SelectItem key={origin} value={origin}>
                      {origin}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1 space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Локация</label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Любая" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Любая</SelectItem>
                    {locations.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10 shrink-0 text-muted-foreground"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                aria-label="Сбросить фильтры"
                title="Сбросить фильтры"
              >
                <RotateCcw className="size-[18px]" />
              </Button>
            </div>
          </div>
        </div>

        {filteredMaterials.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMaterials.map((material) => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border rounded-3xl bg-secondary/10">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Package className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Ничего не найдено</h3>
            <p className="text-muted-foreground max-w-xs mx-auto mt-2">
              Попробуйте изменить фильтры или поисковый запрос.
            </p>
            {hasActiveFilters && (
              <Button type="button" variant="outline" className="mt-6" onClick={resetFilters}>
                <RotateCcw data-icon="inline-start" />
                Сбросить фильтры
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
