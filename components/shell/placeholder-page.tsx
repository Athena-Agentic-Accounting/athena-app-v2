import type { RemixiconComponentType } from "@remixicon/react"

import { PageHeader } from "@/components/shell/page-header"

export default function PlaceholderPage({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  icon?: RemixiconComponentType
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader
        title={title}
        description={description}
        icon={icon}
        actionLabel={actionLabel}
        onAction={onAction}
      />
      <div className="flex-1 overflow-auto bg-background p-5">
        <p className="text-sm text-muted-foreground">Coming soon.</p>
      </div>
    </div>
  )
}

export function createPlaceholderPage(
  title: string,
  description: string,
  icon?: RemixiconComponentType,
) {
  return function Page() {
    return <PlaceholderPage title={title} description={description} icon={icon} />
  }
}
