"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

import { decideAgentApproval } from "@/lib/api/activity-approvals";
import { approveActivityPlanWithAgent } from "@/lib/api/activity-plan";
import { getApprovalQueue } from "@/lib/api/approvals";
import {
  confirmActivityPlan,
  getActivity,
  getActivityMessages,
  linkActivityPlan,
  postActivityMessage,
  subscribeActivityStream,
} from "@/lib/api/activities";
import type { ActivityRecord } from "@/lib/activities/types";
import type {
  ActivityStreamEvent,
  PlanReviewDecision,
} from "@/lib/genui/types";
import {
  buildArtifactFromStreamEvents,
  extractThoughtsFromStream,
} from "@/lib/session/build-artifact-from-stream";
import {
  mapActivityMessages,
  sortMessagesByCreatedAt,
  type SessionChatMessage,
} from "@/lib/session/map-messages";
import {
  mergeStreamEvents,
  parseStreamEvent,
} from "@/lib/session/parse-stream-event";
import { isPermanentStreamError, type StreamError } from "@/lib/api/sse";

export type StreamStatus = "idle" | "connecting" | "connected" | "syncing";

export type SessionError =
  | { kind: "auth"; message: string }
  | { kind: "not_found"; message: string }
  | { kind: "timeout"; message: string }
  | { kind: "connection_lost"; message: string };

function extractStreamEventsFromMessages(
  messages: any[],
  activityId: string,
): ActivityStreamEvent[] {
  const events: ActivityStreamEvent[] = [];
  for (const msg of messages) {
    const structured = msg.structured ?? msg.structured_;
    if (structured && typeof structured === "object") {
      const parsed = parseStreamEvent(
        {
          id: msg.id,
          activityId: activityId,
          timestamp: msg.createdAt ?? msg.created_at,
          event: structured,
        },
        activityId,
      );
      if (parsed) {
        events.push(parsed);
      }
    }
  }
  return events;
}

function synthesizeApprovalGateEvent(
  gateRecord: any,
  activityId: string,
): ActivityStreamEvent {
  return {
    id: `queue-gate-${gateRecord.id}`,
    activityId,
    timestamp: gateRecord.createdAt ?? gateRecord.created_at ?? new Date().toISOString(),
    event: {
      type: "approval_gate",
      data: {
        gateId: gateRecord.id,
        title: gateRecord.title,
        gateType: gateRecord.gateType ?? gateRecord.gate_type,
        pendingAction: gateRecord.pendingAction ?? gateRecord.pending_action,
        payload: gateRecord.payload ?? {},
        stepIndex: gateRecord.stepIndex ?? gateRecord.step_index ?? undefined,
      },
    },
  };
}

export function useActivitySession(
  activityId: string,
  initialPrompt?: string | null,
) {
  const { getToken } = useAuth();
  const [activity, setActivity] = useState<ActivityRecord | null>(null);
  const [messages, setMessages] = useState<SessionChatMessage[]>([]);
  const [streamEvents, setStreamEvents] = useState<ActivityStreamEvent[]>([]);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>("idle");
  const [sessionError, setSessionError] = useState<SessionError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const [initialPromptSent, setInitialPromptSent] = useState(false);

  const activityIdRef = useRef(activityId);
  const assistantCountRef = useRef(0);
  const isAwaitingResponseRef = useRef(isAwaitingResponse);
  const pollFailuresRef = useRef(0);
  const inactivityTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    activityIdRef.current = activityId;
  }, [activityId]);

  useEffect(() => {
    isAwaitingResponseRef.current = isAwaitingResponse;
  }, [isAwaitingResponse]);

  useEffect(() => {
    assistantCountRef.current = messages.filter(
      (message) => message.role === "assistant",
    ).length;
  }, [messages]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      window.clearTimeout(inactivityTimerRef.current);
    }
    if (!isAwaitingResponseRef.current) return;

    inactivityTimerRef.current = window.setTimeout(() => {
      if (isAwaitingResponseRef.current) {
        setIsAwaitingResponse(false);
        setStreamStatus("idle");
        setSessionError({
          kind: "timeout",
          message:
            "Athena is taking longer than expected. You can retry or check back shortly.",
        });
      }
    }, 120000);
  }, []);

  const refreshDurableState = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const [rawMessages, pendingGates] = await Promise.all([
        getActivityMessages(token, activityIdRef.current).catch(() => null),
        getApprovalQueue(token, { activityId: activityIdRef.current }).catch(() => null),
      ]);

      if (rawMessages === null && pendingGates === null) {
        throw new Error("Both message and approval polling failed");
      }

      pollFailuresRef.current = 0;
      setSessionError((curr) => (curr?.kind === "connection_lost" ? null : curr));
      resetInactivityTimer();

      if (rawMessages !== null) {
        const sorted = sortMessagesByCreatedAt(rawMessages);
        const mapped = mapActivityMessages(sorted);
        setMessages(mapped);

        const messageEvents = extractStreamEventsFromMessages(sorted, activityIdRef.current);
        setStreamEvents((current) => {
          let updated = current;
          for (const ev of messageEvents) {
            updated = mergeStreamEvents(updated, ev);
          }
          return updated;
        });

        const assistantCount = mapped.filter(
          (message) => message.role === "assistant",
        ).length;
        if (assistantCount > assistantCountRef.current) {
          setIsAwaitingResponse(false);
          setStreamStatus("idle");
        }
        assistantCountRef.current = assistantCount;
      }

      if (pendingGates !== null) {
        const activityGates = (pendingGates || [])
          .filter(
            (g: any) =>
              (g.activityId ?? g.activity_id) === activityIdRef.current,
          )
          .map((g: any) => synthesizeApprovalGateEvent(g, activityIdRef.current));

        setStreamEvents((current) => {
          let updated = current;
          for (const ev of activityGates) {
            updated = mergeStreamEvents(updated, ev);
          }
          return updated;
        });
      }
    } catch {
      pollFailuresRef.current += 1;
      if (pollFailuresRef.current >= 8) {
        setIsAwaitingResponse(false);
        setStreamStatus("idle");
        setSessionError({
          kind: "connection_lost",
          message:
            "Unable to sync with Athena. Repeated connection attempts failed.",
        });
      }
    }
  }, [getToken, resetInactivityTimer]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        let token = await getToken();
        let waits = 0;
        while (!token && waits < 10 && !cancelled) {
          await new Promise((r) => setTimeout(r, 300));
          token = await getToken();
          waits++;
        }
        if (cancelled) return;

        const [record, rawMessages, pendingGates] = await Promise.all([
          getActivity(token, activityIdRef.current),
          getActivityMessages(token, activityIdRef.current).catch(() => []),
          getApprovalQueue(token, { activityId: activityIdRef.current }).catch(() => []),
        ]);
        if (cancelled) return;

        setActivity(record);
        const sorted = sortMessagesByCreatedAt(rawMessages);
        setMessages(mapActivityMessages(sorted));

        const messageEvents = extractStreamEventsFromMessages(sorted, activityIdRef.current);
        const activityGates = (pendingGates || [])
          .filter(
            (g: any) =>
              (g.activityId ?? g.activity_id) === activityIdRef.current,
          )
          .map((g: any) => synthesizeApprovalGateEvent(g, activityIdRef.current));

        let mergedEvents = messageEvents;
        for (const gate of activityGates) {
          mergedEvents = mergeStreamEvents(mergedEvents, gate);
        }
        setStreamEvents(mergedEvents);
      } catch (err) {
        if (!cancelled) {
          toast.error("Could not load activity session", {
            description:
              err instanceof Error ? err.message : "Something went wrong.",
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [activityId, getToken]);

  useEffect(() => {
    if (!initialPrompt || initialPromptSent || isLoading) return;

    const prompt = initialPrompt.trim();
    if (!prompt) return;

    const alreadySeeded = messages.some((message) => message.role === "user");
    let cancelled = false;

    async function bootstrapFirstRun() {
      setIsAwaitingResponse(true);
      setSessionError(null);
      try {
        const token = await getToken();
        if (cancelled) return;

        if (!alreadySeeded) {
          await postActivityMessage(token, activityIdRef.current, prompt);
          if (cancelled) return;
        }

        setInitialPromptSent(true);
        await refreshDurableState();
      } catch {
        if (!cancelled) {
          setIsAwaitingResponse(false);
          toast.error("Could not send initial prompt");
        }
      }
    }

    void bootstrapFirstRun();
    return () => {
      cancelled = true;
    };
  }, [
    activityId,
    getToken,
    initialPrompt,
    initialPromptSent,
    isLoading,
    messages,
    refreshDurableState,
  ]);

  useEffect(() => {
    if (!isAwaitingResponse) {
      if (!sessionError) {
        setStreamStatus("idle");
      }
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    let retryTimer: number | undefined;
    let retryCount = 0;
    let authRetryCount = 0;
    let tokenWaits = 0;

    async function connect(forceRefresh = false) {
      setStreamStatus("connecting");
      let token: string | null = null;
      try {
        token = forceRefresh
          ? await (getToken as any)({ skipCache: true }).catch(() => getToken())
          : await getToken();
      } catch {
        token = await getToken().catch(() => null);
      }

      if (cancelled) return;

      if (!token) {
        tokenWaits += 1;
        if (tokenWaits > 10) {
          setStreamStatus("idle");
          setIsAwaitingResponse(false);
          setSessionError({
            kind: "auth",
            message: "Not signed in. Please reload the page to authenticate.",
          });
          return;
        }
        retryTimer = window.setTimeout(() => {
          if (!cancelled) void connect(true);
        }, 500);
        return;
      }

      unsubscribe?.();
      unsubscribe = subscribeActivityStream(token, activityIdRef.current, {
        onOpen: () => {
          if (cancelled) return;
          setStreamStatus("connected");
          retryCount = 0;
          authRetryCount = 0;
          void refreshDurableState().catch(() => {});
        },
        onEvent: (raw) => {
          if (cancelled) return;
          resetInactivityTimer();

          const record = raw && typeof raw === "object" ? (raw as Record<string, any>) : null;
          const eventType = record?.event?.type ?? record?.type;

          if (eventType === "message") {
            const data = record?.event?.data ?? record?.data;
            if (data) {
              const msgId = String(record?.id ?? record?.eventId ?? crypto.randomUUID());
              setMessages((current) => {
                if (current.some((m) => m.id === msgId)) return current;
                return [
                  ...current,
                  {
                    id: msgId,
                    role: data.role,
                    content: data.content,
                  },
                ];
              });
              if (data.role === "assistant") {
                setIsAwaitingResponse(false);
              }
            }
            return;
          }

          const parsed = parseStreamEvent(raw, activityIdRef.current);
          if (!parsed) return;

          if (
            parsed.event.type === "approval_gate" ||
            parsed.event.type === "attention_required" ||
            parsed.event.type === "question_choice"
          ) {
            setIsAwaitingResponse(false);
          }

          setStreamEvents((current) => mergeStreamEvents(current, parsed));
        },
        onDone: () => {
          if (cancelled) return;
          const wasAwaiting = isAwaitingResponseRef.current;
          void refreshDurableState();
          if (wasAwaiting) {
            retryTimer = window.setTimeout(() => {
              if (!cancelled) void connect();
            }, 1500);
          } else {
            setIsAwaitingResponse(false);
            setStreamStatus("idle");
          }
        },
        onError: (error) => {
          if (cancelled) return;

          const status = (error as StreamError).status || 0;

          if (status === 404) {
            setStreamStatus("idle");
            setIsAwaitingResponse(false);
            setSessionError({
              kind: "not_found",
              message: "Activity not found or tenant mismatch.",
            });
            return;
          }

          if (status === 401 || status === 403) {
            authRetryCount += 1;
            if (authRetryCount <= 3) {
              setStreamStatus("syncing");
              retryTimer = window.setTimeout(() => {
                if (!cancelled) void connect(true);
              }, 1000);
              return;
            }

            setStreamStatus("idle");
            setIsAwaitingResponse(false);
            setSessionError({
              kind: "auth",
              message: "Session authentication failed or expired.",
            });
            return;
          }

          // Tier 1: Transient error — auto-fallback to polling with Syncing badge
          setStreamStatus("syncing");
          retryCount += 1;
          retryTimer = window.setTimeout(
            () => {
              if (!cancelled) void connect();
            },
            Math.min(1000 * Math.pow(2, retryCount), 10000),
          );
        },
      });
    }

    void connect();

    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      unsubscribe?.();
    };
  }, [activityId, getToken, isAwaitingResponse, refreshDurableState, resetInactivityTimer]);

  useEffect(() => {
    if (!isAwaitingResponse) return;

    resetInactivityTimer();

    const pollTimer = window.setInterval(() => {
      void refreshDurableState();
    }, 2500);

    return () => {
      window.clearInterval(pollTimer);
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isAwaitingResponse, refreshDurableState, resetInactivityTimer]);

  const retrySession = useCallback(async () => {
    setSessionError(null);
    pollFailuresRef.current = 0;

    const token = await getToken();
    if (!token) {
      setSessionError({
        kind: "auth",
        message: "Not signed in. Please reload the page to authenticate.",
      });
      return;
    }

    await refreshDurableState();
    const assistantCount = messages.filter((m) => m.role === "assistant").length;
    if (assistantCount === assistantCountRef.current) {
      setIsAwaitingResponse(true);
    }
  }, [getToken, messages, refreshDurableState]);

  const artifact = useMemo(
    () =>
      buildArtifactFromStreamEvents(
        streamEvents,
        (activity?.plan as any[]) || undefined,
      ),
    [streamEvents, activity?.plan],
  );

  const thoughts = useMemo(
    () => extractThoughtsFromStream(streamEvents),
    [streamEvents],
  );

  const refreshActivity = useCallback(async () => {
    const token = await getToken();
    const record = await getActivity(token, activityIdRef.current);
    setActivity(record);
  }, [getToken]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      const optimisticId = `optimistic-${Date.now()}`;
      setMessages((current) => [
        ...current,
        { id: optimisticId, role: "user", content: trimmed },
      ]);
      setIsSending(true);
      setIsAwaitingResponse(true);
      setSessionError(null);

      try {
        const token = await getToken();
        await postActivityMessage(token, activityIdRef.current, trimmed);
        await refreshDurableState();
      } catch (err) {
        setIsAwaitingResponse(false);
        setMessages((current) =>
          current.filter((message) => message.id !== optimisticId),
        );
        toast.error("Could not send message", {
          description:
            err instanceof Error ? err.message : "Something went wrong.",
        });
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [getToken, refreshDurableState],
  );

  const handlePlanDecision = useCallback(
    async (decision: PlanReviewDecision, gateId?: string) => {
      const token = await getToken();

      if (decision === "start_now") {
        setIsAwaitingResponse(true);
        setSessionError(null);
        try {
          const result = await approveActivityPlanWithAgent(
            token,
            activityIdRef.current,
          );
          const planUrl = result.planUrl ?? result.plan_url;

          if (planUrl) {
            await linkActivityPlan(token, activityIdRef.current, planUrl);
          } else {
            await confirmActivityPlan(token, activityIdRef.current);
          }
        } catch {
          await confirmActivityPlan(token, activityIdRef.current);
        }

        toast.success("Plan confirmed — execution started");
        await refreshActivity();
        return;
      }

      if (decision === "reject") {
        if (gateId) {
          await decideAgentApproval(token, gateId, { decision: "reject" });
        } else {
          await postActivityMessage(
            token,
            activityIdRef.current,
            "Please regenerate the plan with revisions based on my feedback.",
          );
        }

        toast.success("Plan rejected — Athena will regenerate it");
        setIsAwaitingResponse(true);
        setSessionError(null);
        return;
      }

      if (decision === "save" || decision === "schedule") {
        toast.message("Use Start now or Reject for this plan review.");
      }
    },
    [getToken, refreshActivity],
  );

  const handleApprovalDecision = useCallback(
    async (
      gateId: string,
      payload: {
        decision: "approve" | "reject" | "edit";
        notes?: string;
        editedPayload?: Record<string, unknown>;
      },
    ) => {
      const token = await getToken();
      setIsAwaitingResponse(true);
      setSessionError(null);
      try {
        await decideAgentApproval(token, gateId, payload);
      } catch (err) {
        const msg = err instanceof Error ? err.message.toLowerCase() : "";
        if (msg.includes("already resolved") || msg.includes("approved")) {
          // Handled gracefully as already resolved
        } else {
          throw err;
        }
      }
      setStreamEvents((current) =>
        current.filter((event) => {
          if (event.event.type !== "approval_gate") return true;
          return (event.event.data as any)?.gateId !== gateId;
        }),
      );
      toast.success("Decision recorded");
    },
    [getToken],
  );

  return {
    activity,
    artifact,
    thoughts,
    messages,
    streamEvents,
    streamStatus,
    sessionError,
    isLoading,
    isSending,
    isAwaitingResponse,
    sendMessage,
    handlePlanDecision,
    handleApprovalDecision,
    refreshMessages: refreshDurableState,
    refreshActivity,
    retrySession,
  };
}

export type UseActivitySessionReturn = ReturnType<typeof useActivitySession>;

