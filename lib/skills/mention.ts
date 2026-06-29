export type MentionRange = {
  query: string
  start: number
  end: number
}

/** Returns the active @-mention at the cursor, if any. */
export function getMentionAtCursor(text: string, cursor: number): MentionRange | null {
  const before = text.slice(0, cursor)
  const match = before.match(/(?:^|\s)@([^\s@]*)$/)
  if (!match) return null

  const query = match[1] ?? ""
  const atIndex = before.lastIndexOf(`@${query}`)
  if (atIndex < 0) return null

  return { query, start: atIndex, end: cursor }
}

export function filterSkillsByMention<T extends { name: string }>(
  skills: T[],
  query: string,
): T[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return skills.slice(0, 8)

  return skills
    .filter((skill) => skill.name.toLowerCase().includes(normalized))
    .slice(0, 8)
}
