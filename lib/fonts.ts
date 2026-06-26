import { Stack_Sans_Headline } from "next/font/google"

export const stackSansHeadline = Stack_Sans_Headline({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-stack-sans-headline",
  weight: ["200", "300", "400", "500", "600", "700"],
  fallback: ["system-ui", "sans-serif"],
})

export const stackSansHeadlineFamily =
  '"Stack Sans Headline", var(--font-stack-sans-headline), system-ui, sans-serif'
