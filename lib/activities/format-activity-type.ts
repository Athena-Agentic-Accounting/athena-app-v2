import { formatActivityCategory } from "@/lib/activities/categories"

/** Human-readable label for backend activity.type values. */
export function formatActivityType(type?: string | null): string {
  return formatActivityCategory(type)
}
