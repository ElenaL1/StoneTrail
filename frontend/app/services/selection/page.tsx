import { ServiceDetailPage } from "@/components/service-detail"
import { getServiceBySlug } from "@/lib/services-data"
import { loadCopy } from "@/lib/pages/load-copy"

export const metadata = {
  title: "Подбор камня — StoneTrail",
  description:
    "Экспертный подбор слэба под проект: анализ ТЗ, шорт-лист из закрытого фонда, проверка качества и коммерческое предложение.",
}

export default async function SelectionPage() {
  const copy = await loadCopy("services/selection")
  const def = getServiceBySlug("selection")!
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
