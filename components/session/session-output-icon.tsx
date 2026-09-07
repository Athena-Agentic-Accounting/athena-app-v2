import {
  RiAlertLine,
  RiBarChartLine,
  RiBookOpenLine,
  RiCheckboxLine,
  RiFileLine,
  RiFileTextLine,
  RiGridLine,
  RiListCheck2,
  RiShieldCheckLine,
} from "@remixicon/react"

import type { SessionOutputItem } from "@/lib/session/output-items"

type SessionOutputIconProps = {
  output: SessionOutputItem
  className?: string
  "aria-hidden"?: boolean
}

export function SessionOutputIcon({ output, ...props }: SessionOutputIconProps) {
  if (output.source === "artifact") {
    const Icon = output.tab.kind === "plan_review" ? RiListCheck2 : RiFileTextLine
    return <Icon {...props} />
  }

  const Icon = (() => {
    switch (output.event.event.type) {
      case "narrative":
        return RiFileTextLine
      case "table":
        return RiGridLine
      case "journal_entry_review":
        return RiBookOpenLine
      case "checklist":
        return RiCheckboxLine
      case "chart":
        return RiBarChartLine
      case "file_created":
        return RiFileLine
      case "attention_required":
        return RiAlertLine
      case "approval_gate":
        return RiShieldCheckLine
      case "progress":
      case "question_choice":
        return RiFileTextLine
    }
  })()

  return <Icon {...props} />
}
