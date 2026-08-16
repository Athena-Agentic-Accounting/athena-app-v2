"use client"

import type { ReactNode } from "react"
import type { RemixiconComponentType } from "@remixicon/react"
import { RiAddLine, RiArrowRightSLine, RiListCheck2, RiSearchLine } from "@remixicon/react"
import Link from "next/link"

import { NotificationPopover } from "@/components/shell/notification-popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type PageHeaderBreadcrumb = {
  label: string
  href?: string
}

export type PageHeaderProps = {
  title: string
  description?: string
  icon?: RemixiconComponentType
  breadcrumbs?: PageHeaderBreadcrumb[]
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  onSearch?: () => void
  showSearch?: boolean
  showNotifications?: boolean
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  icon: Icon = RiListCheck2,
  breadcrumbs,
  actionLabel = "New task",
  actionHref,
  onAction,
  onSearch,
  showSearch = true,
  showNotifications = true,
  actions,
  className,
}: PageHeaderProps) {
  const hasBreadcrumbs = Boolean(breadcrumbs?.length)

  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-6",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex flex-col gap-0.5">
          {hasBreadcrumbs ? (
            <nav
              aria-label="Breadcrumb"
              className="flex min-w-0 items-center gap-0.5 text-base font-normal tracking-tight"
            >
              {breadcrumbs!.map((crumb, index) => {
                const isLast = index === breadcrumbs!.length - 1

                return (
                  <span key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-0.5">
                    {index > 0 ? (
                      <RiArrowRightSLine className="size-3.5 shrink-0 text-muted-foreground/60" />
                    ) : null}
                    {crumb.href && !isLast ? (
                      <Link
                        href={crumb.href}
                        className="truncate text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        className={cn(
                          "truncate",
                          isLast ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {crumb.label}
                      </span>
                    )}
                  </span>
                )
              })}
            </nav>
          ) : (
            <h1 className="truncate text-base font-normal tracking-tight text-foreground">
              {title}
            </h1>
          )}
          {description ? (
            <p className="truncate text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {showSearch ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-8 text-muted-foreground"
            aria-label="Search"
            onClick={onSearch}
          >
            <RiSearchLine className="size-4" />
          </Button>
        ) : null}

        {showNotifications ? <NotificationPopover /> : null}

        {actions ??
          (actionHref ? (
            <Button size="sm" className="h-9 px-4 text-xs" asChild>
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : onAction ? (
            <Button
              size="sm"
              className="h-9 gap-1.5 px-4 text-xs"
              onClick={onAction}
            >
              <RiAddLine className="size-3.5" />
              {actionLabel}
            </Button>
          ) : null)}
      </div>
    </header>
  )
}
