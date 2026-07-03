export type SseHandlers = {
  onEvent: (event: unknown) => void
  onError?: (error: Error) => void
  onOpen?: () => void
  onDone?: () => void
}

export class StreamError extends Error {
  status: number

  constructor(status: number, message = `Stream failed (${status})`) {
    super(message)
    this.name = "StreamError"
    this.status = status
  }
}

export function isPermanentStreamError(error: Error): boolean {
  if (error instanceof StreamError) {
    return error.status === 401 || error.status === 403 || error.status === 404
  }

  const match = /Stream failed \((\d+)\)/.exec(error.message)
  if (!match) return false

  const status = Number(match[1])
  return status === 401 || status === 403 || status === 404
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
    throw new StreamError(response.status)
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
