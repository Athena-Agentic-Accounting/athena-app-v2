"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { EditActivityDialog } from "@/components/session/edit-activity-dialog";
import { SessionWorkspaceView } from "@/components/session/session-workspace-view";
import { Spinner } from "@/components/ui/spinner";
import { useActivitySession } from "@/hooks/use-activity-session";
import { useActivitySessionRegistration } from "@/hooks/use-activity-session-registry";

type ActivitySessionViewProps = {
  activityId: string;
  initialPrompt?: string | null;
};

export function ActivitySessionView({
  activityId,
  initialPrompt,
}: ActivitySessionViewProps) {
  const router = useRouter();
  useActivitySessionRegistration(activityId);
  const session = useActivitySession(activityId, initialPrompt);
  const [editOpen, setEditOpen] = useState(false);

  if (session.isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Spinner className="size-5 text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <SessionWorkspaceView
        activityId={activityId}
        activityName={session.activity?.name}
        activityLocked={Boolean(session.activity?.auditLockedAt)}
        artifact={session.artifact}
        thoughts={session.thoughts}
        streamEvents={session.streamEvents}
        chatMessages={session.messages}
        showPlanAction={Boolean(session.artifact)}
        streamStatus={session.streamStatus}
        isSending={session.isSending}
        isAwaitingResponse={session.isAwaitingResponse}
        onSendMessage={session.sendMessage}
        onPlanDecision={session.handlePlanDecision}
        onApprovalDecision={session.handleApprovalDecision}
        onEditActivity={() => setEditOpen(true)}
        onClose={() => router.push("/home")}
      />

      <EditActivityDialog
        activity={session.activity}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={() => void session.refreshActivity()}
      />
    </>
  );
}
