import { connection } from "next/server"
import { CatalogProvider } from "@/lib/catalog-context"

export default async function CatalogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await connection()
  return <CatalogProvider>{children}</CatalogProvider>
}
