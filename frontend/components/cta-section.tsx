import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { onPrimaryCtaClass } from "@/lib/on-primary-cta"
import { cn } from "@/lib/utils"

const points = [
  "Доступ к эксклюзивным коллекциям слэбов высшего сорта",
  "Прямой обмен опытом с признанными мастерами индустрии",
  "Профессиональный консалтинг по подбору и обработке материалов",
]

export function CtaSection() {
  return (
    <section className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl items-stretch gap-0 lg:grid-cols-2">
        <div className="flex flex-col justify-center px-5 py-16 lg:px-12 lg:py-24">
          <h2 className="text-balance font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Станьте частью закрытого профессионального сообщества.
          </h2>
          <p className="mt-4 max-w-md text-pretty leading-relaxed text-primary-foreground/75">
            Получите доступ к знаниям, которые накапливались десятилетиями, и к фонду материалов, недоступных на открытом рынке. 
            Мы объединяем тех, кто видит в камне не просто материал, а искусство.
          </p>
          <ul className="mt-8 space-y-3">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-primary-foreground/90">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-foreground">
                  <Check className="size-3 text-primary" />
                </span>
                {point}
              </li>
            ))}
          </ul>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild className={cn(onPrimaryCtaClass, "h-11 gap-2 px-5 text-sm")}>
              <Link href="/register">
                Присоединиться
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 border-primary-foreground/30 bg-transparent px-5 text-sm text-primary-foreground hover:bg-black/10 hover:text-primary-foreground"
            >
              <Link href="/contacts">Связаться с экспертом</Link>
            </Button>
          </div>
        </div>

        <div className="relative min-h-64 overflow-hidden lg:min-h-full">
          <img
            src="/stone/interior.png"
            alt="Современный интерьер кухни с островом из натурального мрамора в стиле «водопад»"
            className="size-full object-cover"
          />
        </div>
      </div>
    </section>
  )
}
