import { ServiceDetailPage } from "@/components/service-detail"
import { getServiceBySlug } from "@/lib/services-data"
import { loadCopy } from "@/lib/pages/load-copy"

export const metadata = {
  title: "Логистика — StoneTrail",
  description:
    "Доставка слэбов и изделий на объект: спецтранспорт, индивидуальная упаковка, страхование и GPS-отслеживание.",
}

export default async function LogisticsPage() {
  const copy = await loadCopy("services/logistics")
  const def = getServiceBySlug("logistics")!
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
