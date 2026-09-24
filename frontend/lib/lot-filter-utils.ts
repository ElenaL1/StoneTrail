import { parseSizeSortKey, parseThickness } from "@/lib/measure-utils"

export type LotFilterDef = {
  label: string
  allLabel: string
}

export const EMPTY_FILTER_VALUE = "all"

export const LOT_STATUS_ORDER = ["В наличии", "Зарезервирован", "Под заказ"] as const

export type LotFilterKitConfig<K extends string> = {
  keys: readonly K[]
  empty: Record<K, string>
  /** Preferred order for `status` when that key is present. */
  statusOrder?: readonly string[]
  /** Preferred order for `finish` when that key is present. */
  finishOrder?: readonly string[]
}

/**
 * Shared filter/prune/unique helpers for lot and variant tables.
 * A selected value of `"all"` means the column is unconstrained.
 * Option lists for a column ignore that column's own filter so the user can switch values.
 */
export function createLotFilterKit<T extends Record<K, string>, K extends string>(
  config: LotFilterKitConfig<K>,
) {
  const keys = config.keys
  const empty = config.empty
  const statusOrder = config.statusOrder ?? LOT_STATUS_ORDER
  const finishOrder = config.finishOrder

  function uniqueFieldValues(items: T[], key: K): string[] {
    const values: string[] = Array.from(
      new Set(items.map((item) => item[key]).filter(Boolean)),
    )
    if (key === "status") {
      const ordered = statusOrder.filter((value) => values.includes(value))
      const rest = values.filter((value) => !statusOrder.includes(value))
      return [...ordered, ...rest]
    }
    if (key === "thickness") {
      return values.sort((a, b) => (parseThickness(a) ?? 0) - (parseThickness(b) ?? 0))
    }
    if (key === "finish") {
      if (finishOrder) {
        const ordered = finishOrder.filter((value) => values.includes(value))
        const rest = values.filter((value) => !finishOrder.includes(value))
        return [...ordered, ...rest.sort((a, b) => a.localeCompare(b, "ru"))]
      }
      return values.sort((a, b) => a.localeCompare(b, "ru"))
    }
    if (key === "size") {
      return values.sort(
        (a, b) => parseSizeSortKey(a) - parseSizeSortKey(b) || a.localeCompare(b, "ru"),
      )
    }
    return values.sort((a, b) => a.localeCompare(b, "ru"))
  }

  function filterItems(items: T[], filters: Record<K, string>): T[] {
    return items.filter((item) =>
      keys.every((key) => filters[key] === EMPTY_FILTER_VALUE || item[key] === filters[key]),
    )
  }

  function filterOptions(items: T[], filters: Record<K, string>, key: K): string[] {
    return uniqueFieldValues(filterItems(items, { ...filters, [key]: EMPTY_FILTER_VALUE }), key)
  }

  function hasActiveFilters(filters: Record<K, string>): boolean {
    return keys.some((key) => filters[key] !== empty[key])
  }

  function pruneFilters(items: T[], filters: Record<K, string>): Record<K, string> {
    const next = { ...filters }
    for (const key of keys) {
      if (next[key] === EMPTY_FILTER_VALUE) continue
      const options = uniqueFieldValues(
        filterItems(items, { ...next, [key]: EMPTY_FILTER_VALUE }),
        key,
      )
      if (!options.includes(next[key])) next[key] = EMPTY_FILTER_VALUE
    }
    return next
  }

  function getVisibleFilterKeys(items: T[]): K[] {
    return keys.filter((key) => uniqueFieldValues(items, key).length > 1)
  }

  return {
    uniqueFieldValues,
    filterItems,
    filterOptions,
    hasActiveFilters,
    pruneFilters,
    getVisibleFilterKeys,
  }
}
