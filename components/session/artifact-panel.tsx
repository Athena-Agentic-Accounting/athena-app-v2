"use client";

import { useMemo, useState } from "react";

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
      {/* Ramp-style Deliverable Workpaper Header */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-background px-5 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="text-sm font-medium text-foreground">
            {activeTab.title || activeTab.slug || "Deliverable"}
          </span>
          <span className="rounded-md border border-border px-2 py-0.5 text-[11px] font-normal text-muted-foreground">
            Draft · Requires review
          </span>
        </div>

        {artifact.tabs.length > 1 ? (
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-0.5">
            {artifact.tabs.map((tab) => {
              const active = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTabId(tab.id)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-normal transition-colors",
                    active
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.title || tab.slug}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto w-full max-w-4xl px-8 py-6 pb-24">
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
