import Link from "next/link"
import { ArrowRight, BadgeCheck, MapPin, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { stats } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { arePromotionsEnabled } from "@/lib/promo-utils"

export function Hero() {
  const isBannerEnabled = arePromotionsEnabled();

  return (
    <section className={cn("relative overflow-hidden", !isBannerEnabled && "bg-muted/30")}>
      {/* soft ambient wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_85%_0%,var(--primary-soft),transparent)]"
      />
      
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-14 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="py-24 lg:py-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
            Наследие мастерства и эксклюзивный фонд
          </span>
          
          <h1 className="mt-6 text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Искусство видеть камень. <span className="text-primary">До каждого слэба.</span>
          </h1>
          
          <p className="mt-5 max-w-lg text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Синтез более чем 25-летнего опыта в индустрии и коллекции редчайших материалов со всего мира. 
            Мы создали пространство для тех, кто ценит техническое совершенство и подлинную эстетику натурального камня.
          </p>
          
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-11 gap-2 px-5 text-sm bg-primary text-primary-foreground hover:bg-[var(--primary-hover)]">
              <Link href="/catalog">
                Посетить коллекцию
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11 px-5 text-sm">
              <Link href="/register">Вступить в сообщество</Link>
            </Button>
          </div>
          
          <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-border pt-6">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="font-display text-2xl font-bold text-foreground">{s.value}</dt>
                <dd className="text-sm text-muted-foreground">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-secondary shadow-[0_20px_60px_-25px_rgba(35,72,58,0.35)]">
            <img
              src="/stone/hero-slabs.png"
              alt="Полированные слэбы натурального камня на стойках в премиальном шоуруме"
              className="size-full object-cover"
            />
          </div>

          {/* Floating live-data overlay card */}
          <div className="absolute -left-3 top-8 w-56 rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur-sm sm:-left-6">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <MapPin className="size-3.5 text-primary" />
              Закрытый фонд StoneTrail
            </div>
            <p className="mt-2 font-display text-2xl font-bold text-foreground">
              24 <span className="text-sm font-medium text-muted-foreground">слэба в наличии</span>
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-primary">
              <TrendingUp className="size-3.5" />
              Calacatta Gold · Мрамор
            </div>
          </div>

          {/* Expert selection overlay */}
          <div className="absolute -bottom-4 right-2 flex items-center gap-3 rounded-xl border border-border bg-card/95 p-3 pr-4 shadow-lg backdrop-blur-sm sm:right-4">
            <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-primary">
              <BadgeCheck className="size-5" />
            </span>
            <div className="text-left">
              <p className="text-sm font-semibold leading-tight text-foreground">Выбор эксперта</p>
              <p className="text-xs text-muted-foreground">Ручной отбор слэбов высшего сорта</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
