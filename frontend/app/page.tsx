import { Hero } from "@/components/hero"
import { ValuePillars } from "@/components/value-pillars"
import { InventoryPreview } from "@/components/inventory-preview"
import { CtaSection } from "@/components/cta-section"
import { loadCopy } from "@/lib/pages/load-copy"

export default async function Page() {
  const copy = await loadCopy("home")
  return (
    <>
      <Hero
        kicker={copy.text("hero.kicker", "Наследие мастерства и эксклюзивный фонд")}
        title={copy.text("hero.title", "Искусство видеть камень.")}
        titleAccent={copy.text("hero.titleAccent", "До каждого слэба.")}
        lead={copy.text(
          "hero.lead",
          "Синтез более чем 25-летнего опыта в индустрии и коллекции редчайших материалов со всего мира. Мы создали пространство для тех, кто ценит техническое совершенство и подлинную эстетику натурального камня.",
        )}
      />
      <ValuePillars
        kicker={copy.text("pillars.kicker", "Принципы мастерства")}
        title={copy.text("pillars.title", "Фундамент, построенный на десятилетиях практики.")}
      />
      <InventoryPreview />
      <CtaSection
        title={copy.text("cta.title", "Станьте частью закрытого профессионального сообщества.")}
        lead={copy.text(
          "cta.lead",
          "Получите доступ к знаниям, которые накапливались десятилетиями, и к фонду материалов, недоступных на открытом рынке. Мы объединяем тех, кто видит в камне не просто материал, а искусство.",
        )}
      />
    </>
  )
}
