import { ApiError, backendRequest, backendUpload } from "@/lib/api/backend-client"

/** The engine stores one committed Chart of Accounts file per organization
 * (`GET/POST/PUT/DELETE /api/upload/coa`; write ops need an accountant role). */
export type CoaRecord = {
  id: string
  fileKey: string
  publicUrl: string
  fileName: string
  version: number
  uploadedAt?: string
}

export async function getCoa(token: string | null): Promise<CoaRecord | null> {
  try {
    return await backendRequest<CoaRecord>("/api/upload/coa", { token })
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null
    throw err
  }
}

export async function uploadCoa(
  token: string | null,
  file: File,
): Promise<{ fileKey: string; publicUrl: string }> {
  const formData = new FormData()
  formData.append("file", file)
  return backendUpload("/api/upload/coa", { token, formData })
}

export async function replaceCoa(
  token: string | null,
  file: File,
): Promise<{ fileKey: string; publicUrl: string }> {
  const formData = new FormData()
  formData.append("file", file)
  return backendUpload("/api/upload/coa", { method: "PUT", token, formData })
}

export type CoaPreviewRow = { code: string; name: string }

/** Best-effort preview of a CoA CSV: first two columns of the first rows.
 * Returns null when the content doesn't look tabular (e.g. XLSX binary). */
export function parseCoaPreview(text: string, limit = 8): CoaPreviewRow[] | null {
  if (!text || text.includes("\u0000")) return null

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length === 0) return null

  const rows: CoaPreviewRow[] = []
  for (const line of lines) {
    const cells = line
      .split(",")
      .map((cell) => cell.trim().replace(/^"|"$/g, ""))
    if (cells.length < 2) return null
    rows.push({ code: cells[0], name: cells[1] })
    if (rows.length >= limit + 1) break
  }

  // Drop a header row like "code,name" / "Account Code,Account Name".
  const [first, ...rest] = rows
  const looksLikeHeader = first && !/\d/.test(first.code)
  const dataRows = looksLikeHeader ? rest : rows

  return dataRows.length > 0 ? dataRows.slice(0, limit) : null
}
