export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/** Accounting display — negatives in parentheses, e.g. ($1,173.30). */
export function formatAccountingCurrency(value: number): string {
  const absolute = formatCurrency(Math.abs(value))
  return value < 0 ? `(${absolute})` : absolute
}

export function sumJournalSide(
  lines: { debit?: number; credit?: number }[],
  side: "debit" | "credit",
): number {
  return lines.reduce((sum, line) => sum + (line[side] ?? 0), 0)
}

export function compareSortValues(a: unknown, b: unknown): number {
  const numA = typeof a === "number" ? a : Number(a)
  const numB = typeof b === "number" ? b : Number(b)
  if (!Number.isNaN(numA) && !Number.isNaN(numB) && `${a}` !== "" && `${b}` !== "") {
    return numA - numB
  }
  return String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: true })
}
