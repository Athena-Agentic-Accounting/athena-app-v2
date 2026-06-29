"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";

import { NewTaskDialog } from "@/components/checklist/new-task-dialog";
import { WelcomeCheckSheet } from "@/components/checklist/welcome-check-sheet";
import { useActivityBoard } from "@/components/providers/activity-board-provider";
import { updateActivityStatus } from "@/lib/api/activities";
import { activityStatusForTaskStatus } from "@/lib/activities/status";
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
    refreshBoard,
  } = useActivityBoard();
  const { selectedClientId } = useClient();
  const [welcomeSheetOpen, setWelcomeSheetOpen] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>("to-do");
  const [refreshKey, setRefreshKey] = useState(0);
  const [localTasks, setLocalTasks] = useState<ChecklistTask[]>([]);

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
        ) : (
          <ChecklistBoard
            tasks={localTasks}
            onTasksChange={(tasks) => void handleTasksChange(tasks)}
            onTaskClick={handleTaskClick}
            showEmptyState={
              viewState === "post-welcome" && localTasks.length === 0
            }
            emptyDescription="Try asking Athena something, or create your first activity."
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
    </div>
  );
}
