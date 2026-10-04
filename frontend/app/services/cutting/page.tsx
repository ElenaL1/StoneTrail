import { ServiceDetailPage } from "@/components/service-detail"
import { getServiceBySlug } from "@/lib/services-data"
import { loadCopy } from "@/lib/pages/load-copy"

export const metadata = {
  title: "Раскрой — StoneTrail",
  description:
    "Точный раскрой слэбов 5-осевыми ЧПУ: контроль фактуры, минимальный отход и финишная обработка под заказ.",
}

export default async function CuttingPage() {
  const copy = await loadCopy("services/cutting")
  const def = getServiceBySlug("cutting")!
  const { icon, ...props } = def
  return (
    <ServiceDetailPage
      icon={icon}
      {...props}
      tag={copy.text("tag", props.tag)}
      title={copy.text("title", props.title)}
      intro={copy.text("intro", props.intro)}
    />
  )
}
