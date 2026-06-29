export const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Paris",
  "Africa/Accra",
  "Africa/Lagos",
  "Asia/Dubai",
  "Asia/Singapore",
  "UTC",
] as const

export function getDefaultTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  } catch {
    return "UTC"
  }
}

export function combineStartDateTime(date: string, time: string): string {
  const trimmedDate = date.trim()
  const trimmedTime = time.trim() || "09:00"
  if (!trimmedDate) return ""

  const [hours, minutes] = trimmedTime.split(":").map((part) => part.padStart(2, "0"))
  return `${trimmedDate}T${hours ?? "09"}:${minutes ?? "00"}:00`
}

export function splitStartDateTime(value?: string | null): { date: string; time: string } {
  if (!value) return { date: "", time: "09:00" }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    const [datePart, timePart] = value.split("T")
    return {
      date: datePart ?? "",
      time: timePart?.slice(0, 5) ?? "09:00",
    }
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  }
}

export function isStartDateInFuture(startDateIso: string): boolean {
  const parsed = new Date(startDateIso)
  if (Number.isNaN(parsed.getTime())) return false
  return parsed.getTime() > Date.now()
}

export function shouldCreateAsSchedule(options: {
  recurrence?: string
  startDate?: string
}): boolean {
  if (options.recurrence && options.recurrence !== "none") return true
  if (options.startDate && isStartDateInFuture(options.startDate)) return true
  return false
}
