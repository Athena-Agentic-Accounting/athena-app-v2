"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  RiArrowDownSLine,
  RiFileCopyLine,
  RiThumbDownLine,
  RiThumbUpLine,
} from "@remixicon/react";
import { toast } from "sonner";
import styles from "./ThinkingReasoning.module.css";

// Geometry — keep in sync with the CSS module.
const SENT_H = 40; // 2 lines × 20px
const GAP = 4;
const MAX_H = 180; // viewport grows with content up to this, then scrolls
const FADE = 16; // top/bottom fade once the viewport is capped

export type ThinkingReasoningProps = {
  /** Array of reasoning sentence strings */
  sentences?: string[];
  /** Or a newline-delimited thought string */
  thoughtContent?: string;
  /** True while the agent is still reasoning — label shimmers, expands stream */
  isThinking?: boolean;
  /** Status text shown while shimmering/thinking (defaults to "Thinking…") */
  statusLabel?: string;
  /** Elapsed seconds to display in "Thought for Ns" summary */
  elapsedSeconds?: number;
  /** Whether the reasoning trace starts open after completion (default: false) */
  defaultOpen?: boolean;
  /** Whether to show action icons (thumbs up/down, copy) when expanded and done */
  showActions?: boolean;
  className?: string;
};

export function ThinkingReasoning({
  sentences: propSentences,
  thoughtContent,
  isThinking = false,
  statusLabel,
  elapsedSeconds: propElapsedSeconds,
  defaultOpen = false,
  showActions = false,
  className,
}: ThinkingReasoningProps) {
  // Parse lines from thoughtContent or sentences prop (purely from real props)
  const activeSentences = useMemo(() => {
    if (propSentences && propSentences.length > 0) {
      return propSentences;
    }
    if (thoughtContent) {
      return thoughtContent
        .split("\n")
        .map((s) => s.replace(/^[•\-\*]\s*/, "").trim())
        .filter(Boolean);
    }
    return [];
  }, [propSentences, thoughtContent]);

  // Live timer state
  const [liveElapsed, setLiveElapsed] = useState<number | null>(
    propElapsedSeconds ?? null
  );
  const startTimeRef = useRef<number | null>(null);

  // Accordion state for when thinking is completed
  const [open, setOpen] = useState(defaultOpen);
  const [fade, setFade] = useState({ top: false, bottom: true });
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Track live elapsed time while thinking
  useEffect(() => {
    if (isThinking) {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }
      const interval = setInterval(() => {
        if (startTimeRef.current) {
          setLiveElapsed(
            Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
          );
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      if (startTimeRef.current && !liveElapsed) {
        setLiveElapsed(
          Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
        );
      }
    }
  }, [isThinking, liveElapsed]);

  const done = !isThinking;
  const expanded = done ? open : true;
  const count = activeSentences.length;

  const elapsedS = propElapsedSeconds ?? liveElapsed ?? 5;

  const contentH = count > 0 ? count * SENT_H + (count - 1) * GAP : 0;
  const capped = contentH > MAX_H;
  const viewH = capped ? MAX_H : contentH;
  const scrollable = done && open;
  const translate = scrollable ? 0 : capped ? MAX_H - FADE - contentH : 0;

  const showTop = scrollable ? fade.top : capped;
  const showBottom = scrollable ? fade.bottom : capped;
  const mask = capped
    ? `linear-gradient(to bottom, transparent 0, #000 ${showTop ? FADE : 0}px, #000 calc(100% - ${showBottom ? FADE : 0}px), transparent 100%)`
    : "none";

  const onScroll = () => {
    const el = viewportRef.current;
    if (!el) return;
    setFade({
      top: el.scrollTop > 1,
      bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 1,
    });
  };

  const toggle = () => {
    const next = !open;
    if (next) {
      setFade({ top: false, bottom: true });
      if (viewportRef.current) viewportRef.current.scrollTop = 0;
    }
    setOpen(next);
  };

  const handleCopy = () => {
    const textToCopy = activeSentences.join("\n");
    if (!textToCopy) return;
    void navigator.clipboard.writeText(textToCopy);
    toast.success("Thinking trace copied to clipboard");
  };

  const handleFeedback = (type: "up" | "down") => {
    setFeedback(type);
    toast.success(
      type === "up" ? "Thanks for your feedback!" : "Feedback recorded"
    );
  };

  // If nothing to display and not thinking, render nothing
  if (!isThinking && activeSentences.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.tr}${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        className={`${styles.trHeader}${done ? ` ${styles.isClickable}` : ""}`}
        aria-expanded={expanded}
        aria-label="Toggle thought"
        onClick={done ? toggle : undefined}
      >
        {done ? (
          <span className={styles.trLabel}>
            <span className={styles.trVerb}>Thought</span> for {elapsedS}s
          </span>
        ) : (
          <span className={`${styles.trLabel} ${styles.trShimmer}`}>
            {statusLabel || "Thinking…"}
          </span>
        )}
        {done && (
          <svg
            className={styles.trChevron}
            viewBox="0 0 24 24"
            width="12"
            height="12"
            aria-hidden="true"
          >
            <path
              d="m4.5 15.75 7.5-7.5 7.5 7.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <div
        className={`${styles.trCollapsible}${
          expanded ? "" : ` ${styles.isCollapsed}`
        }`}
      >
        <div className={styles.trInner}>
          <div
            ref={viewportRef}
            className={`${styles.trViewport}${
              scrollable ? ` ${styles.isScroll}` : ""
            }`}
            style={{
              height: `${viewH}px`,
              WebkitMaskImage: mask,
              maskImage: mask,
            }}
            onScroll={scrollable ? onScroll : undefined}
          >
            <div
              className={styles.trStream}
              style={{ transform: `translateY(${translate}px)` }}
            >
              {activeSentences.map((line, i) => (
                <p key={i} className={styles.trSentence}>
                  {line}
                </p>
              ))}
            </div>
          </div>

          {done && showActions && activeSentences.length > 0 && (
            <div className={styles.trActions}>
              <button
                type="button"
                onClick={() => handleFeedback("up")}
                className={`${styles.trActionBtn}${
                  feedback === "up" ? ` ${styles.isActiveUp}` : ""
                }`}
                title="Good response"
                aria-label="Thumbs up"
              >
                <RiThumbUpLine size={13} />
              </button>
              <button
                type="button"
                onClick={() => handleFeedback("down")}
                className={`${styles.trActionBtn}${
                  feedback === "down" ? ` ${styles.isActiveDown}` : ""
                }`}
                title="Bad response"
                aria-label="Thumbs down"
              >
                <RiThumbDownLine size={13} />
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className={styles.trActionBtn}
                title="Copy thoughts"
                aria-label="Copy thoughts"
              >
                <RiFileCopyLine size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
