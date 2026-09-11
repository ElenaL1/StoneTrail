import { ServiceDetailPage } from "@/components/service-detail"
import { getServiceBySlug } from "@/lib/services-data"

export const metadata = {
  title: "Консультации — StoneTrail",
  description:
    "Технические консультации по камню: свойства, обработка, уход, подбор альтернатив. Разбираем проект и пишем заключение.",
}

export default function ConsultationsPage() {
  const def = getServiceBySlug("consultations")!
  const { icon, ...props } = def
  return <ServiceDetailPage icon={icon} {...props} />
}
