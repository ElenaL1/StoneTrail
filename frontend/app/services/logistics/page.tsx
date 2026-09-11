import { ServiceDetailPage } from "@/components/service-detail"
import { getServiceBySlug } from "@/lib/services-data"

export const metadata = {
  title: "Логистика — StoneTrail",
  description:
    "Доставка слэбов и изделий на объект: спецтранспорт, индивидуальная упаковка, страхование и GPS-отслеживание.",
}

export default function LogisticsPage() {
  const def = getServiceBySlug("logistics")!
  const { icon, ...props } = def
  return <ServiceDetailPage icon={icon} {...props} />
}
