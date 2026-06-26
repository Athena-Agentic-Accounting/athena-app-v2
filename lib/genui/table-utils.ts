export const TOTAL_ROW_FLAG = "__isTotal"

export function markTotalRow(row: Record<string, unknown>): Record<string, unknown> {
  return { ...row, [TOTAL_ROW_FLAG]: true }
}

export function isTotalRow(row: Record<string, unknown>): boolean {
  return row[TOTAL_ROW_FLAG] === true
}
