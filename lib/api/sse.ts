export type SseHandlers = {
  onEvent: (event: unknown) => void
  onError?: (error: Error) => void
  onOpen?: () => void
  onDone?: () => void
}

export function extractSseDataPayloads(chunk: string): string[] {
  const payloads: string[] = []

  for (const line of chunk.split(/\r?\n/)) {
    if (!line.startsWith("data:")) continue
    const payload = line.replace(/^data:\s?/, "").trim()
    if (payload) payloads.push(payload)
  }

  return payloads
}

export async function readSseResponse(
  response: Response,
  handlers: SseHandlers,
): Promise<void> {
  if (!response.ok || !response.body) {
    throw new Error(`Stream failed (${response.status})`)
  }

  handlers.onOpen?.()

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split(/\r?\n\r?\n/)
    buffer = chunks.pop() ?? ""

    for (const chunk of chunks) {
      for (const payload of extractSseDataPayloads(chunk)) {
        if (payload === "[DONE]") continue

        try {
          handlers.onEvent(JSON.parse(payload) as unknown)
        } catch {
          handlers.onEvent({ type: "narrative", data: { markdown: payload } })
        }
      }
    }
  }

  handlers.onDone?.()
}
