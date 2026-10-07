const UNIT_SUFFIX: Record<string, string> = {
  m2: "₽/м²",
  slab: "₽/слэб",
  ton: "₽/т",
  piece: "₽/шт",
}

export function formatOfferPrice(
  amount: string | number | null | undefined,
  unit: string | null | undefined,
): string {
  if (amount === null || amount === undefined || amount === "") return "—"
  const value = typeof amount === "number" ? amount : Number(String(amount).replace(",", "."))
  if (!Number.isFinite(value)) return "—"
  const money = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(value)
  return `${money} ${UNIT_SUFFIX[unit ?? ""] ?? "₽"}`
}
