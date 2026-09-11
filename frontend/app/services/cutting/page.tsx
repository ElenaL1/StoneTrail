import { ServiceDetailPage } from "@/components/service-detail"
import { getServiceBySlug } from "@/lib/services-data"

export const metadata = {
  title: "Раскрой — StoneTrail",
  description:
    "Точный раскрой слэбов 5-осевыми ЧПУ: контроль фактуры, минимальный отход и финишная обработка под заказ.",
}

export default function CuttingPage() {
  const def = getServiceBySlug("cutting")!
  const { icon, ...props } = def
  return <ServiceDetailPage icon={icon} {...props} />
}
