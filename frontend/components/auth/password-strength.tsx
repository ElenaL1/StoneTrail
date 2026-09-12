import { AUTH_MESSAGES } from "@/lib/auth/constants"
import { getPasswordStrength, type PasswordStrength } from "@/lib/auth/validation"
import { cn } from "@/lib/utils"

const LABELS: Record<Exclude<PasswordStrength, "empty">, string> = {
  weak: "Слабый пароль",
  medium: "Средний пароль",
  strong: "Надёжный пароль",
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getPasswordStrength(password)
  const activeBars = strength === "empty" ? 0 : strength === "weak" ? 1 : strength === "medium" ? 2 : 3

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="grid grid-cols-3 gap-1.5" aria-hidden="true">
        {[1, 2, 3].map((bar) => (
          <span
            key={bar}
            className={cn(
              "h-1 rounded-full bg-border",
              activeBars >= bar && strength === "weak" && "bg-destructive",
              activeBars >= bar && strength === "medium" && "bg-accent",
              activeBars >= bar && strength === "strong" && "bg-primary",
            )}
          />
        ))}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {strength === "empty" ? AUTH_MESSAGES.passwordHint : LABELS[strength]}
        {strength !== "empty" && strength !== "strong" ? `. ${AUTH_MESSAGES.passwordHint}` : null}
      </p>
    </div>
  )
}
