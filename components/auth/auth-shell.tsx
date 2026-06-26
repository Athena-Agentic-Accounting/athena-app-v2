import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"

type AuthShellProps = {
  children: ReactNode
  footer?: ReactNode
  header?: ReactNode
}

export function AuthLogo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2">
      <span
        className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
        aria-hidden
      >
        <span className="block size-3.5 rounded-br-[0.7rem] rounded-tl-[0.7rem] bg-primary-foreground" />
      </span>
      <span className="text-sm font-normal text-foreground">Athena</span>
    </Link>
  )
}

export function AuthShell({ children, footer, header }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/auth.jpg"
          alt=""
          fill
          className="object-cover object-center"
          priority
          aria-hidden
        />
      </div>

      <main className="relative z-10 flex flex-1 items-center justify-end p-3 sm:p-4 md:p-4">
        <div className="flex w-full min-h-[calc(100vh-1.5rem)] flex-col rounded-2xl bg-background shadow-md ring-1 ring-border sm:min-h-[calc(100vh-2rem)] md:h-auto md:min-h-[calc(100vh-2rem)] lg:w-1/2 lg:max-w-[650px]">
          <div className="flex flex-1 flex-col px-6 py-8 sm:px-10 md:px-12 lg:px-16 lg:py-12">
            <div className="flex w-full items-center justify-start">
              {header ?? <AuthLogo />}
            </div>

            <div className="flex flex-1 flex-col items-center justify-center py-6">
              <div className="flex w-full max-w-[392px] flex-col gap-6">
                {children}
              </div>
            </div>

            {footer ? (
              <div className="pb-2 text-center text-sm text-muted-foreground">
                {footer}
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}

type AuthStepPanelProps = {
  title: string
  description?: string
  children: ReactNode
  onBack?: () => void
  backLabel?: string
}

export function AuthStepPanel({
  title,
  description,
  children,
  onBack,
  backLabel = "Back",
}: AuthStepPanelProps) {
  return (
    <section className="flex w-full flex-col items-center gap-6">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground transition hover:text-foreground"
        >
          {backLabel}
        </button>
      ) : null}

      <div className="w-full flex flex-col gap-1 text-center">
        <h1 className="text-lg font-normal text-foreground lg:text-xl">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      <div className="w-full">{children}</div>
    </section>
  )
}
