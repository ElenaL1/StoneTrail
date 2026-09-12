import { CatalogProvider } from "@/lib/catalog-context"

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return <CatalogProvider>{children}</CatalogProvider>
}
