import { ServiceDetailPage } from "@/components/service-detail"
import { getServiceBySlug } from "@/lib/services-data"

export const metadata = {
  title: "Подбор камня — StoneTrail",
  description:
    "Экспертный подбор слэба под проект: анализ ТЗ, шорт-лист из закрытого фонда, проверка качества и коммерческое предложение.",
}

export default function SelectionPage() {
  const def = getServiceBySlug("selection")!
  const { icon, ...props } = def
  return <ServiceDetailPage icon={icon} {...props} />
}
