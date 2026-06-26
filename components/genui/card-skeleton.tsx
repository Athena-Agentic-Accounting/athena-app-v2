import { cn } from "@/lib/utils"

type CardSkeletonProps = {
  variant?: "default" | "table" | "chart"
  className?: string
}

export function CardSkeleton({ variant = "default", className }: CardSkeletonProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border/70 bg-background p-4",
        className,
      )}
    >
      <div className="mb-3 h-4 w-40 animate-pulse rounded bg-muted" />
      {variant === "table" ? (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-3 animate-pulse rounded bg-muted" />
            ))}
          </div>
          {Array.from({ length: 4 }).map((_, row) => (
            <div key={row} className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, col) => (
                <div key={col} className="h-3 animate-pulse rounded bg-muted/80" />
              ))}
            </div>
          ))}
        </div>
      ) : variant === "chart" ? (
        <div className="flex h-[280px] items-end gap-2 pt-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex-1 animate-pulse rounded-t bg-muted"
              style={{ height: `${40 + index * 12}%` }}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-muted/80" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted/70" />
        </div>
      )}
    </div>
  )
}
