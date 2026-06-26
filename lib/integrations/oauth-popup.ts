export type OAuthCallbackMessage = {
  type: "athena-oauth-complete"
  status: "success" | "error"
  provider?: string | null
  message?: string | null
}

export function openOAuthPopup(authUrl: string): Promise<OAuthCallbackMessage> {
  return new Promise((resolve, reject) => {
    const popup = window.open(
      authUrl,
      "athena-oauth",
      "popup=yes,width=640,height=720,noopener=no,noreferrer=no",
    )

    if (!popup) {
      reject(new Error("Popup blocked. Allow popups for this site and try again."))
      return
    }

    let settled = false

    const cleanup = () => {
      window.removeEventListener("message", onMessage)
      window.clearInterval(pollTimer)
    }

    const finish = (handler: () => void) => {
      if (settled) return
      settled = true
      cleanup()
      handler()
    }

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const data = event.data as OAuthCallbackMessage | undefined
      if (!data || data.type !== "athena-oauth-complete") return

      finish(() => {
        if (data.status === "success") {
          resolve(data)
          return
        }
        reject(new Error(data.message ?? "Connection failed."))
      })
    }

    window.addEventListener("message", onMessage)

    const pollTimer = window.setInterval(() => {
      if (!popup.closed) return
      finish(() => {
        reject(new Error("Connection window closed before completing."))
      })
    }, 500)
  })
}
