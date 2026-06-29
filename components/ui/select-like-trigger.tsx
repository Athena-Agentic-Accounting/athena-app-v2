import * as React from "react"
import type { ComponentType } from "react"
import { ChevronsUpDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SelectLikeTriggerProps = React.ComponentProps<typeof Button> & {
  icon?: ComponentType<{ className?: string }>
}

function SelectLikeTrigger({
  icon: Icon,
  children,
  className,
  variant = "outline",
  size = "sm",
  ...props
}: SelectLikeTriggerProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("w-full justify-between gap-2 font-normal", className)}
      {...props}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
        {Icon ? <Icon className="size-3.5 shrink-0 text-muted-foreground" /> : null}
        <span className="truncate">{children}</span>
      </span>
      <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
    </Button>
  )
}

export { SelectLikeTrigger }
