import { Hero } from "@/components/hero"
import { ValuePillars } from "@/components/value-pillars"
import { InventoryPreview } from "@/components/inventory-preview"
import { CtaSection } from "@/components/cta-section"

export default function Page() {
  return (
    <>
      <Hero />
      <ValuePillars />
      <InventoryPreview />
      <CtaSection />
    </>
  )
}
