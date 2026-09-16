"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";

import { NewTaskDialog } from "@/components/checklist/new-task-dialog";
import { WelcomeCheckSheet } from "@/components/checklist/welcome-check-sheet";
import { useActivityBoard } from "@/components/providers/activity-board-provider";
import { EditActivityDialog } from "@/components/session/edit-activity-dialog";
import { getActivity, updateActivityStatus } from "@/lib/api/activities";
import { activityStatusForTaskStatus } from "@/lib/activities/status";
import type { ActivityRecord } from "@/lib/activities/types";
import type { TaskCardAction } from "@/components/checklist/task-card";
import { useClient } from "@/components/providers/client-provider";
import { ChecklistToolbar } from "@/components/shell/checklist-toolbar";
import { PageHeader } from "@/components/shell/page-header";
import { Spinner } from "@/components/ui/spinner";
import {
  getAthenaMetadata,
  getPrimaryClientName,
} from "@/lib/athena/user-metadata";
import {
  createWelcomeCheckTask,
  getBoardViewState,
  WELCOME_CHECK_TASK_ID,
} from "@/lib/checklist/board-tasks";
import type { ChecklistTask, TaskStatus } from "@/lib/checklist/mock-tasks";
import { ALL_CLIENTS_ID } from "@/lib/clients/resolve-clients";

const ChecklistBoard = dynamic(
  () =>
    import("@/components/checklist/checklist-board").then(
      (module) => module.ChecklistBoard,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-background">
        <Spinner className="size-5 text-muted-foreground" />
      </div>
    ),
  },
);

export function CloseChecklistView() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();
  const {
    tasks: apiTasks,
    allCount,
    assignedCount,
    isLoading,
    error: boardError,
    refreshBoard,
  } = useActivityBoard();
  const { selectedClientId } = useClient();
  const [welcomeSheetOpen, setWelcomeSheetOpen] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>("to-do");
  const [refreshKey, setRefreshKey] = useState(0);
  const [localTasks, setLocalTasks] = useState<ChecklistTask[]>([]);
  const [editActivity, setEditActivity] = useState<ActivityRecord | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const meta = useMemo(() => {
    void refreshKey;
    return getAthenaMetadata(
      user?.unsafeMetadata as Record<string, unknown> | undefined,
    );
  }, [user?.unsafeMetadata, refreshKey]);

  const viewState = getBoardViewState(meta);

  const boardTasks = useMemo(() => {
    if (viewState === "welcome-check") {
      const welcomeTask = createWelcomeCheckTask(getPrimaryClientName(meta));
      const withoutWelcome = apiTasks.filter(
        (task) => task.id !== WELCOME_CHECK_TASK_ID,
      );
      return [welcomeTask, ...withoutWelcome];
    }

    return apiTasks;
  }, [apiTasks, meta, viewState]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLocalTasks(boardTasks);
    });
    return () => {
      cancelled = true;
    };
  }, [boardTasks]);

  const handleTaskClick = useCallback(
    (task: ChecklistTask) => {
      router.push(`/activities/${task.id}`);
    },
    [router],
  );

  function handleNewTask(status: TaskStatus = "to-do") {
    setNewTaskStatus(status);
    setNewTaskOpen(true);
  }

  function handleTaskCreated(task: ChecklistTask) {
    setLocalTasks((current) => [...current, task]);
    void refreshBoard();
  }

  const handleTasksChange = useCallback(
    async (nextTasks: ChecklistTask[]) => {
      const changedTask = nextTasks.find((nextTask) => {
        const currentTask = localTasks.find((task) => task.id === nextTask.id);
        return currentTask && currentTask.status !== nextTask.status;
      });

      setLocalTasks(nextTasks);
      if (!changedTask) return;

      try {
        const token = await getToken();
        await updateActivityStatus(token, changedTask.id, {
          status: activityStatusForTaskStatus(changedTask.status),
        });
        void refreshBoard();
      } catch (err) {
        setLocalTasks(localTasks);
        toast.error("Could not update activity status", {
          description:
            err instanceof Error ? err.message : "Something went wrong.",
        });
      }
    },
    [getToken, localTasks, refreshBoard],
  );

  const handleTaskAction = useCallback(
    async (task: ChecklistTask, action: TaskCardAction) => {
      const token = await getToken();

      if (action === "edit") {
        try {
          const activity = await getActivity(token, task.id);
          setEditActivity(activity);
          setEditOpen(true);
        } catch (err) {
          toast.error("Could not load the task", {
            description:
              err instanceof Error ? err.message : "Something went wrong.",
          });
        }
        return;
      }

      if (
        action === "stop" &&
        !window.confirm(
          "Stop this task? It will be marked complete and locked — this cannot be undone.",
        )
      ) {
        return;
      }

      const transition =
        action === "pause"
          ? { status: "awaiting_input", reason: "Paused by user", label: "Task paused" }
          : action === "resume"
            ? { status: "executing", reason: "Resumed by user", label: "Task resumed" }
            : { status: "completed", reason: "Cancelled by user", label: "Task stopped" };

      try {
        await updateActivityStatus(token, task.id, {
          status: transition.status,
          reason: transition.reason,
        });
        toast.success(transition.label);
        void refreshBoard();
      } catch (err) {
        toast.error("Could not update the task", {
          description:
            err instanceof Error ? err.message : "Something went wrong.",
        });
      }
    },
    [getToken, refreshBoard],
  );

  function handleWelcomeComplete() {
    setRefreshKey((value) => value + 1);
    void refreshBoard();
  }

  const showClientTag = selectedClientId === ALL_CLIENTS_ID;

  const toolbarAllCount =
    viewState === "welcome-check" ? allCount + 1 : allCount;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader
        title="Issues"
        description="Manage and track your close tasks"
        actionLabel="New task"
        onAction={() => handleNewTask()}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
        {viewState !== "post-welcome" ? (
          <ChecklistToolbar
            assignedCount={assignedCount}
            allCount={toolbarAllCount}
          />
        ) : null}

        {isLoading && boardTasks.length === 0 ? (
          <div className="flex min-h-0 flex-1 items-center justify-center bg-background">
            <Spinner className="size-5 text-muted-foreground" />
          </div>
        ) : boardError && boardTasks.length === 0 ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-background px-6 text-center">
            <p className="text-sm text-muted-foreground">
              Could not load your tasks — {boardError}
            </p>
            <button
              type="button"
              className="text-xs text-foreground underline underline-offset-2"
              onClick={() => void refreshBoard()}
            >
              Try again
            </button>
          </div>
        ) : (
          <ChecklistBoard
            tasks={localTasks}
            onTasksChange={(tasks) => void handleTasksChange(tasks)}
            onTaskClick={handleTaskClick}
            onTaskAction={(task, action) => void handleTaskAction(task, action)}
            showEmptyState={
              viewState === "post-welcome" && localTasks.length === 0
            }
            emptyDescription="Try asking LUCA something, or create your first activity."
            onWelcomeCheckClick={() => setWelcomeSheetOpen(true)}
            onAddTask={handleNewTask}
            showClientTag={showClientTag}
          />
        )}
      </div>

      <WelcomeCheckSheet
        open={welcomeSheetOpen}
        onOpenChange={setWelcomeSheetOpen}
        onComplete={handleWelcomeComplete}
      />

      <NewTaskDialog
        open={newTaskOpen}
        onOpenChange={setNewTaskOpen}
        onCreated={handleTaskCreated}
        defaultStatus={newTaskStatus}
      />

      <EditActivityDialog
        activity={editActivity}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={() => void refreshBoard()}
      />
    </div>
  );
}
