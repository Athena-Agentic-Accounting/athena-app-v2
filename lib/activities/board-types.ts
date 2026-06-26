export type ActivityBoardStatus =
  | "to_do"
  | "in_progress"
  | "needs_attention"
  | "in_review"
  | "completed"
  | string

export type BoardActivity = {
  id: string
  name: string
  status?: ActivityBoardStatus
  clientId?: string
  clientName?: string
  type?: string
  sessionId?: string
  sourcePrompt?: string | null
  assignedTo?: {
    id?: string
    name?: string
    email?: string
  } | null
  dueDate?: string | null
  startDate?: string | null
}

export type ActivityBoardColumns = Partial<Record<ActivityBoardStatus, BoardActivity[]>>

/** Backend returns `{ board: { to_do: [...] }, statuses: [...] }`. */
export type ActivityBoardResponse = {
  board?: ActivityBoardColumns
  /** Legacy / alternate shape — kept for compatibility. */
  columns?: ActivityBoardColumns
  statuses?: ActivityBoardStatus[]
  counts?: Partial<Record<ActivityBoardStatus, number>>
  clients?: Array<{ id: string; name: string }>
  teamMembers?: Array<{ id: string; name: string }>
}

export function getBoardColumns(response: ActivityBoardResponse): ActivityBoardColumns {
  return response.board ?? response.columns ?? {}
}
