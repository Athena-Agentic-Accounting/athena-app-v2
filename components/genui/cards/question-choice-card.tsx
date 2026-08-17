"use client"

import { useState } from "react"
import {
  RiArrowLeftSLine,
  RiArrowRightLine,
  RiArrowRightSLine,
  RiFileLine,
  RiUpload2Line,
} from "@remixicon/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import type { QuestionChoiceCardData } from "@/lib/genui/types"
import { cn } from "@/lib/utils"

type QuestionChoiceCardProps = {
  data: QuestionChoiceCardData
  selectedOptionId?: string
  onSelect?: (optionId: string) => void
  onSkip?: () => void
  onStepChange?: (direction: "prev" | "next") => void
  onFilesSubmitted?: (files: File[]) => void
}

export function QuestionChoiceCard({
  data,
  selectedOptionId,
  onSelect,
  onSkip,
  onStepChange,
  onFilesSubmitted,
}: QuestionChoiceCardProps) {
  const [internalSelection, setInternalSelection] = useState<string | undefined>(
    data.selectedOptionId,
  )
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const activeId = selectedOptionId ?? internalSelection
  const stepIndex = data.stepIndex ?? 1
  const stepCount = data.stepCount ?? 1
  const showPager = stepCount > 1

  const isUploadType =
    (data as any).kind === "file_upload" ||
    (!data.options || data.options.length === 0) ||
    data.question.toLowerCase().includes("upload")

  function handleSelect(optionId: string) {
    setInternalSelection(optionId)
    onSelect?.(optionId)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const selected = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...selected].slice(0, 10))
    }
  }

  async function handleSubmitFiles() {
    if (files.length === 0) return
    setIsSubmitting(true)
    try {
      onFilesSubmitted?.(files)
      toast.success(`Uploaded ${files.length} file(s) successfully`)
    } catch {
      toast.error("Failed to upload files")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm p-4 sm:p-5 shadow-xs">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-sm font-semibold leading-snug text-foreground">{data.question}</h3>
        {showPager ? (
          <div className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground">
            <button
              type="button"
              className="flex size-6 items-center justify-center rounded hover:bg-muted disabled:opacity-40"
              disabled={stepIndex <= 1}
              aria-label="Previous question"
              onClick={() => onStepChange?.("prev")}
            >
              <RiArrowLeftSLine className="size-4" />
            </button>
            <span className="min-w-[42px] text-center tabular-nums">
              {stepIndex} of {stepCount}
            </span>
            <button
              type="button"
              className="flex size-6 items-center justify-center rounded hover:bg-muted disabled:opacity-40"
              disabled={stepIndex >= stepCount}
              aria-label="Next question"
              onClick={() => onStepChange?.("next")}
            >
              <RiArrowRightSLine className="size-4" />
            </button>
          </div>
        ) : null}
      </div>

      {data.description ? (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{data.description}</p>
      ) : null}

      {isUploadType ? (
        <div className="mt-4 space-y-3">
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-border/90 bg-muted/20 px-4 py-3 hover:bg-muted/40 transition-colors">
            <span className="text-xs text-muted-foreground font-normal">
              {files.length > 0
                ? `${files.length} file(s) selected: ${files.map((f) => f.name).join(", ")}`
                : "Upload up to 10 files"}
            </span>
            <RiUpload2Line className="size-4 text-muted-foreground shrink-0 ml-2" />
            <input
              type="file"
              multiple
              accept=".csv,.xlsx,.xls,.pdf"
              className="hidden"
              onChange={handleFileInput}
            />
          </label>
          <p className="text-[11px] text-muted-foreground/70">Accepts files up to 60 MB in size</p>

          <div className="mt-4 flex items-center justify-end gap-3 pt-2">
            {data.allowSkip !== false ? (
              <button
                type="button"
                onClick={() => onSkip?.()}
                className="text-xs text-muted-foreground hover:text-foreground font-medium px-2 py-1"
              >
                {data.skipLabel ?? "Skip"}
              </button>
            ) : null}
            <Button
              type="button"
              size="sm"
              disabled={files.length === 0 || isSubmitting}
              onClick={handleSubmitFiles}
              className="h-8 px-4 text-xs font-normal"
            >
              {isSubmitting ? "Submitting…" : "Submit files"}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <ul className="mt-4 space-y-1.5">
            {data.options.map((option, index) => {
              const selected = activeId === option.id

              return (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(option.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                      selected
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded text-[11px] font-medium tabular-nums",
                        selected ? "bg-background text-foreground ring-1 ring-border/70" : "text-muted-foreground/70 bg-muted/60",
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="flex-1 text-xs">{option.label}</span>
                    {selected ? <RiArrowRightLine className="size-3.5 shrink-0 text-muted-foreground" /> : null}
                  </button>
                </li>
              )
            })}
          </ul>

          {data.allowSkip !== false ? (
            <div className="mt-4 flex items-center justify-between pt-1">
              <span className="text-[11px] text-muted-foreground/60 hidden sm:inline">
                ↑ ↓ to navigate · Enter to select · Esc to skip
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-4 text-xs font-normal ml-auto"
                onClick={() => onSkip?.()}
              >
                {data.skipLabel ?? "Skip"}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </article>
  )
}

