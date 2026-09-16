import { useCallback, useState } from "react"

/**
 * Re-run a data-loading effect on demand: list `token` in the effect's deps and
 * call `reload()` from event handlers. Keeps the fetch inside the effect, where
 * its state updates happen asynchronously, instead of calling a loader that
 * sets state from the effect body.
 */
export function useReload(): [token: number, reload: () => void] {
  const [token, setToken] = useState(0)
  const reload = useCallback(() => setToken((current) => current + 1), [])
  return [token, reload]
}
