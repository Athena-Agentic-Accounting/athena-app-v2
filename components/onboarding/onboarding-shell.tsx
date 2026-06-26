import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type OnboardingShellProps = {
  title: string
  description?: string
  stepLabel?: string
  backAction?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function OnboardingShell({
  title,
  description,
  stepLabel,
  backAction,
  children,
  footer,
  className,
}: OnboardingShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className={cn("w-full max-w-lg", className)}>
        {backAction ? <div className="mb-4">{backAction}</div> : null}

        <div className="mb-6 flex flex-col gap-2">
          {stepLabel ? (
            <p className="text-xs text-muted-foreground">{stepLabel}</p>
          ) : null}
          <h1 className="text-2xl font-normal tracking-tight text-foreground">{title}</h1>
          {description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">{children}</div>

        {footer ? <div className="mt-6 flex flex-col gap-3">{footer}</div> : null}
      </div>
    </div>
  )
}
