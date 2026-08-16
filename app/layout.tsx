import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { Toaster } from "sonner"

import { ThemeProvider } from "@/components/providers/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { stackSansHeadline } from "@/lib/fonts"

import "./globals.css"

export const metadata: Metadata = {
  title: "Athena",
  description: "Athena — Agentic Accounting",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${stackSansHeadline.variable} ${stackSansHeadline.className} h-full antialiased`}
      >
        {/* Browser extensions (Grammarly et al.) inject attributes onto <body>
            before React hydrates, which React reports as a hydration mismatch.
            Nothing we render differs between server and client here. */}
        <body
          suppressHydrationWarning
          className="h-full overflow-hidden bg-background font-sans text-foreground"
        >
          <ThemeProvider>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster
              position="top-right"
              richColors
              closeButton
              toastOptions={{
                style: {
                  borderRadius: "var(--radius)",
                },
              }}
            />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
