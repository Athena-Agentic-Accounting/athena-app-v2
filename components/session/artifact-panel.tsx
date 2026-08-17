"use client";

import { useMemo, useState } from "react";
import { RiCheckLine, RiDownloadLine } from "@remixicon/react";
import { toast } from "sonner";

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
  isPlanConfirmed?: boolean;
  activityStatus?: string;
  onActiveTabChange?: (tabId: string) => void;
  onPlanDecision?: (
    decision: PlanReviewDecision,
    gateId?: string,
  ) => void | Promise<void>;
  className?: string;
};

import { SpreadsheetWorkpaper } from "@/components/session/spreadsheet-workpaper";

export function ArtifactPanel({
  artifact,
  activeTabId: controlledActiveTabId,
  isPlanConfirmed,
  activityStatus,
  onActiveTabChange,
  onPlanDecision,
  className,
}: ArtifactPanelProps) {
  const [internalActiveTabId, setInternalActiveTabId] = useState(
    artifact.activeTabId,
  );
  const [planDecided, setPlanDecided] = useState(false);

  const activeTabId = controlledActiveTabId ?? internalActiveTabId;
  const isConfirmed = Boolean(
    isPlanConfirmed ||
      planDecided ||
      activityStatus === "in_progress" ||
      activityStatus === "completed",
  );

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
        "flex min-h-0 min-w-0 flex-1 flex-col bg-background border-r border-border",
        className,
      )}
    >
      <SpreadsheetWorkpaper
        fileName="ForgeStudios_Jul2026_MonthEnd_Workpaper.xlsx"
      />
    </section>
  );
}
