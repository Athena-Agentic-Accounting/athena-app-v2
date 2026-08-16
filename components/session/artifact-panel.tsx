"use client";

import { useMemo, useState } from "react";
import { RiAddLine, RiCloseLine } from "@remixicon/react";

import { MarkdownContent } from "@/components/session/markdown-content";
import { PlanReviewActions } from "@/components/session/plan-review-actions";
import { PlanReviewContent } from "@/components/session/plan-review-content";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PlanReviewDecision } from "@/lib/genui/types";
import type { SessionArtifact } from "@/lib/session/types";
import { cn } from "@/lib/utils";

type ArtifactPanelProps = {
  artifact: SessionArtifact;
  activeTabId?: string;
  onActiveTabChange?: (tabId: string) => void;
  onPlanDecision?: (
    decision: PlanReviewDecision,
    gateId?: string,
  ) => void | Promise<void>;
  className?: string;
};

export function ArtifactPanel({
  artifact,
  activeTabId: controlledActiveTabId,
  onActiveTabChange,
  onPlanDecision,
  className,
}: ArtifactPanelProps) {
  const [internalActiveTabId, setInternalActiveTabId] = useState(
    artifact.activeTabId,
  );
  const [openTabIds, setOpenTabIds] = useState(() =>
    artifact.tabs.map((tab) => tab.id),
  );
  const [planDecided, setPlanDecided] = useState(false);

  const activeTabId = controlledActiveTabId ?? internalActiveTabId;

  function setActiveTabId(tabId: string) {
    setInternalActiveTabId(tabId);
    onActiveTabChange?.(tabId);
  }

  const activeTab = useMemo(
    () =>
      artifact.tabs.find((tab) => tab.id === activeTabId) ?? artifact.tabs[0],
    [activeTabId, artifact.tabs],
  );

  const openTabs = useMemo(
    () => artifact.tabs.filter((tab) => openTabIds.includes(tab.id)),
    [artifact.tabs, openTabIds],
  );

  function closeTab(tabId: string) {
    setOpenTabIds((current) => {
      const next = current.filter((id) => id !== tabId);
      if (next.length === 0) return current;
      return next;
    });

    if (activeTabId === tabId) {
      const nextTabId = openTabIds.filter((id) => id !== tabId).at(-1);
      if (nextTabId) setActiveTabId(nextTabId);
    }
  }

  function handlePlanDecision(decision: PlanReviewDecision) {
    if (activeTab?.kind !== "plan_review") return;
    onPlanDecision?.(decision, activeTab.gateId);
    if (decision === "reject" || decision === "start_now") {
      setPlanDecided(true);
    }
  }

  if (!activeTab) return null;

  return (
    <section
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col bg-background",
        className,
      )}
    >
      <div className="flex shrink-0 items-center gap-1 border-b border-border/70 px-3 py-2">
        {openTabs.map((tab) => {
          const active = tab.id === activeTabId;

          return (
            <div
              key={tab.id}
              className={cn(
                "group flex max-w-[220px] items-center gap-1 rounded-md border px-2.5 py-1 text-xs",
                active
                  ? "border-border/70 bg-muted/40 text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-muted/30",
              )}
            >
              <button
                type="button"
                className="min-w-0 flex-1 truncate text-left"
                onClick={() => setActiveTabId(tab.id)}
              >
                {tab.slug}
              </button>
              {openTabs.length > 1 ? (
                <button
                  type="button"
                  className="flex size-4 shrink-0 items-center justify-center rounded opacity-60 hover:bg-background hover:opacity-100"
                  aria-label={`Close ${tab.title}`}
                  onClick={() => closeTab(tab.id)}
                >
                  <RiCloseLine className="size-3.5" />
                </button>
              ) : null}
            </div>
          );
        })}
        <button
          type="button"
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/40"
          aria-label="Open tab"
        >
          <RiAddLine className="size-4" />
        </button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto max-w-3xl px-8 py-6 pb-24">
          {activeTab.kind === "document" ? (
            <>
              {activeTab.description ? (
                <div className="mb-6 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Description
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/90">
                    {activeTab.description}
                  </p>
                </div>
              ) : null}
              <MarkdownContent markdown={activeTab.markdown} />
            </>
          ) : (
            <PlanReviewContent
              markdown={activeTab.markdown}
              table={activeTab.table}
            />
          )}
        </div>
      </ScrollArea>

      {activeTab.kind === "plan_review" ? (
        <PlanReviewActions
          disabled={planDecided}
          onDecision={handlePlanDecision}
        />
      ) : (
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/70 px-4 py-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-destructive"
          >
            Delete skill
          </Button>
          <Button type="button" variant="outline" size="sm">
            Edit with Athena
          </Button>
          <Button type="button" size="sm" disabled>
            Save
          </Button>
        </div>
      )}
    </section>
  );
}
