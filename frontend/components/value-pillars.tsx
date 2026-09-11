import { ArrowUpRight, Boxes, MessagesSquare, Network } from "lucide-react"
import { pillars } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { arePromotionsEnabled } from "@/lib/promo-utils"

const icons = [MessagesSquare, Boxes, Network]

export function ValuePillars() {
  const isBannerEnabled = arePromotionsEnabled();

  return (
    <section className={cn("border-t border-border", isBannerEnabled ? "bg-muted/40" : "bg-background")}>
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Принципы мастерства</p>
          <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Фундамент, построенный на десятилетиях практики.
          </h2>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {pillars.map((pillar, i) => {
            const Icon = icons[i]
            return (
              <article
                key={pillar.tag}
                className="group flex flex-col rounded-2xl border border-border bg-card p-7 transition-all hover:border-primary/40 hover:shadow-[0_16px_40px_-24px_rgba(35,72,58,0.4)]"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {pillar.verb}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-xl font-bold leading-snug text-foreground">{pillar.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{pillar.description}</p>
                <a
                  href="#"
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
                >
                  Раздел «{pillar.tag}»
                  <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
