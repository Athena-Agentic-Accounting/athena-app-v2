"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react"
import { RiCloseLine } from "@remixicon/react"

import type { ApiSkill } from "@/lib/api/skills"
import { filterSkillsByMention, getMentionAtCursor } from "@/lib/skills/mention"
import { cn } from "@/lib/utils"

type SkillMentionTextareaProps = {
  value: string
  onChange: (value: string) => void
  attachedSkillIds: string[]
  onAttachedSkillIdsChange: (skillIds: string[]) => void
  skills: ApiSkill[]
  placeholder?: string
  rows?: number
  className?: string
  textareaRef?: RefObject<HTMLTextAreaElement | null>
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  disabled?: boolean
  showHint?: boolean
  insertMentionInText?: boolean
  variant?: "plain" | "field"
}

export function SkillMentionTextarea({
  value,
  onChange,
  attachedSkillIds,
  onAttachedSkillIdsChange,
  skills,
  placeholder,
  rows = 2,
  className,
  textareaRef: externalRef,
  onKeyDown,
  disabled = false,
  showHint = true,
  insertMentionInText = true,
  variant = "plain",
}: SkillMentionTextareaProps) {
  const internalRef = useRef<HTMLTextAreaElement>(null)
  const textareaRef = externalRef ?? internalRef
  const [cursor, setCursor] = useState(0)
  const [activeIndex, setActiveIndex] = useState(0)

  const mention = useMemo(() => getMentionAtCursor(value, cursor), [value, cursor])
  const suggestions = useMemo(
    () => (mention ? filterSkillsByMention(skills, mention.query) : []),
    [mention, skills],
  )
  const showSuggestions = Boolean(mention && suggestions.length > 0)

  const attachedSkills = useMemo(
    () =>
      attachedSkillIds
        .map((id) => skills.find((skill) => skill.id === id))
        .filter((skill): skill is ApiSkill => Boolean(skill)),
    [attachedSkillIds, skills],
  )

  useEffect(() => {
    setActiveIndex(0)
  }, [mention?.query])

  const selectSkill = useCallback(
    (skill: ApiSkill) => {
      if (!mention) return

      if (insertMentionInText) {
        const insertion = `@${skill.name} `
        const nextValue = value.slice(0, mention.start) + insertion + value.slice(mention.end)
        onChange(nextValue)

        const nextCursor = mention.start + insertion.length
        window.requestAnimationFrame(() => {
          const element = textareaRef.current
          if (!element) return
          element.focus()
          element.setSelectionRange(nextCursor, nextCursor)
          setCursor(nextCursor)
        })
      } else {
        const nextValue = `${value.slice(0, mention.start)}${value.slice(mention.end)}`.trimStart()
        onChange(nextValue)
        window.requestAnimationFrame(() => {
          const element = textareaRef.current
          if (!element) return
          element.focus()
          const nextCursor = nextValue.length
          element.setSelectionRange(nextCursor, nextCursor)
          setCursor(nextCursor)
        })
      }

      if (!attachedSkillIds.includes(skill.id)) {
        onAttachedSkillIdsChange([...attachedSkillIds, skill.id])
      }
    },
    [
      attachedSkillIds,
      insertMentionInText,
      mention,
      onAttachedSkillIdsChange,
      onChange,
      textareaRef,
      value,
    ],
  )

  function removeSkill(skillId: string) {
    const skill = skills.find((entry) => entry.id === skillId)
    onAttachedSkillIdsChange(attachedSkillIds.filter((id) => id !== skillId))

    if (!skill || !insertMentionInText) return

    const token = `@${skill.name}`
    onChange(
      value
        .replace(new RegExp(`(?:^|\\s)${escapeRegExp(token)}\\s?`, "g"), (match) =>
          match.startsWith(" ") ? " " : "",
        )
        .replace(/\s{2,}/g, " ")
        .trimStart(),
    )
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (showSuggestions) {
      if (event.key === "ArrowDown") {
        event.preventDefault()
        setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1))
        return
      }

      if (event.key === "ArrowUp") {
        event.preventDefault()
        setActiveIndex((index) => Math.max(index - 1, 0))
        return
      }

      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault()
        const skill = suggestions[activeIndex]
        if (skill) selectSkill(skill)
        return
      }

      if (event.key === "Escape") {
        event.preventDefault()
        setCursor(mention?.end ?? cursor)
        return
      }
    }

    onKeyDown?.(event)
  }

  return (
    <div
      className={cn(
        "relative space-y-2",
        variant === "field" &&
          "min-h-9 rounded-md border border-input bg-transparent px-2.5 py-2 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
      )}
    >
      {attachedSkills.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {attachedSkills.map((skill) => (
            <span
              key={skill.id}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-xs text-foreground"
            >
              <span className="truncate">@{skill.name}</span>
              <button
                type="button"
                className="rounded-full text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${skill.name}`}
                disabled={disabled}
                onClick={() => removeSkill(skill.id)}
              >
                <RiCloseLine className="size-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => {
            onChange(event.target.value)
            setCursor(event.target.selectionStart ?? event.target.value.length)
          }}
          onClick={(event) =>
            setCursor((event.target as HTMLTextAreaElement).selectionStart ?? value.length)
          }
          onKeyUp={(event) =>
            setCursor((event.target as HTMLTextAreaElement).selectionStart ?? value.length)
          }
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full resize-none text-sm leading-relaxed outline-none",
            variant === "field"
              ? "min-h-8 bg-transparent text-sm text-foreground placeholder:text-muted-foreground"
              : "bg-transparent text-muted-foreground placeholder:text-muted-foreground",
            className,
          )}
        />

        {showSuggestions && !disabled ? (
          <div
            role="listbox"
            className="absolute top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border/70 bg-popover py-1 shadow-md ring-1 ring-foreground/5"
          >
            {suggestions.map((skill, index) => (
              <button
                key={skill.id}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                  index === activeIndex ? "bg-muted text-foreground" : "text-foreground hover:bg-muted/70",
                )}
                onMouseDown={(event) => {
                  event.preventDefault()
                  selectSkill(skill)
                }}
              >
                <span className="truncate font-medium">{skill.name}</span>
                {skill.category ? (
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">{skill.category}</span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {showHint && !disabled ? (
        <p className="text-[11px] text-muted-foreground">
          Type <span className="font-medium">@</span> to attach skills
        </p>
      ) : null}
    </div>
  )
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
