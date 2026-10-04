import { ServiceDetailPage } from "@/components/service-detail"
import { getServiceBySlug } from "@/lib/services-data"
import { loadCopy } from "@/lib/pages/load-copy"

export const metadata = {
  title: "Консультации — StoneTrail",
  description:
    "Технические консультации по камню: свойства, обработка, уход, подбор альтернатив. Разбираем проект и пишем заключение.",
}

export default async function ConsultationsPage() {
  const copy = await loadCopy("services/consultations")
  const def = getServiceBySlug("consultations")!
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
