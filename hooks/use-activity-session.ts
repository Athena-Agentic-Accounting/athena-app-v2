"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

import { decideAgentApproval } from "@/lib/api/activity-approvals";
import { approveActivityPlanWithAgent } from "@/lib/api/activity-plan";
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
import { isPermanentStreamError } from "@/lib/api/sse";

type StreamStatus = "idle" | "connecting" | "connected" | "error";

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

export function useActivitySession(
  activityId: string,
  initialPrompt?: string | null,
) {
  const { getToken } = useAuth();
  const [activity, setActivity] = useState<ActivityRecord | null>(null);
  const [messages, setMessages] = useState<SessionChatMessage[]>([]);
  const [streamEvents, setStreamEvents] = useState<ActivityStreamEvent[]>([]);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>("idle");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const [initialPromptSent, setInitialPromptSent] = useState(false);
  const [activeOutputId, setActiveOutputId] = useState<string | undefined>();

  const activityIdRef = useRef(activityId);
  const assistantCountRef = useRef(0);
  const isAwaitingResponseRef = useRef(isAwaitingResponse);

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

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setActiveOutputId(undefined);
      try {
        const token = await getToken();
        if (cancelled) return;

        const [record, rawMessages] = await Promise.all([
          getActivity(token, activityIdRef.current),
          getActivityMessages(token, activityIdRef.current),
        ]);
        if (cancelled) return;

        const initialEvents = extractStreamEventsFromMessages(rawMessages, activityIdRef.current);
        setActivity(record);
        setMessages(mapActivityMessages(sortMessagesByCreatedAt(rawMessages)));
        setStreamEvents(initialEvents);

        // On initial load hydration, prioritize plan review if plan is pending confirmation
        if (
          record?.status === "plan_pending" ||
          record?.planStatus === "PENDING_CONFIRMATION" ||
          (record?.plan && record.plan.length > 0 && record.planStatus !== "CONFIRMED")
        ) {
          setActiveOutputId("artifact:plan");
        } else {
          // If an unresolved approval_gate or file_created exists, initialize activeOutputId to it
          const unresolvedGate = [...initialEvents].reverse().find(
            (event) =>
              event.event.type === "approval_gate" &&
              event.event.data.status !== "approved" &&
              event.event.data.status !== "resolved" &&
              event.event.data.status !== "rejected",
          );
          if (unresolvedGate) {
            setActiveOutputId(`event:${unresolvedGate.id}`);
          } else {
            const latestFile = [...initialEvents].reverse().find(
              (event) => event.event.type === "file_created",
            );
            if (latestFile) {
              setActiveOutputId(`event:${latestFile.id}`);
            }
          }
        }
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

  const refreshMessages = useCallback(async () => {
    const token = await getToken();
    const items = sortMessagesByCreatedAt(
      await getActivityMessages(token, activityIdRef.current),
    );
    const mapped = mapActivityMessages(items);
    setMessages(mapped);

    const initialEvents = extractStreamEventsFromMessages(items, activityIdRef.current);
    setStreamEvents((current) => {
      const updated = [...current];
      for (const incoming of initialEvents) {
        const index = updated.findIndex((event) => event.id === incoming.id);
        if (index === -1) {
          updated.push(incoming);
        } else {
          updated[index] = incoming;
        }
      }
      return updated;
    });

    const assistantCount = mapped.filter(
      (message) => message.role === "assistant",
    ).length;
    if (assistantCount > assistantCountRef.current) {
      setIsAwaitingResponse(false);
    }
    assistantCountRef.current = assistantCount;
  }, [getToken]);

  useEffect(() => {
    if (!initialPrompt || initialPromptSent || isLoading) return;

    const prompt = initialPrompt.trim();
    if (!prompt) return;

    // The engine seeds the request as the first user message when it proposes an
    // activity, so don't post a duplicate — but still open the stream so the
    // first planning run streams in. Only post here if nothing seeded it.
    const alreadySeeded = messages.some((message) => message.role === "user");

    let cancelled = false;

    async function bootstrapFirstRun() {
      setIsAwaitingResponse(true);
      try {
        const token = await getToken();
        if (cancelled) return;

        if (!alreadySeeded) {
          await postActivityMessage(token, activityIdRef.current, prompt);
          if (cancelled) return;
        }

        setInitialPromptSent(true);
        await refreshMessages();
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
    refreshMessages,
  ]);

  useEffect(() => {
    if (!isAwaitingResponse) {
      setStreamStatus("idle");
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    let retryTimer: number | undefined;
    let retryCount = 0;

    async function connect() {
      setStreamStatus("connecting");
      const token = await getToken();
      if (cancelled) return;

      unsubscribe?.();
      unsubscribe = subscribeActivityStream(token, activityIdRef.current, {
        onOpen: () => {
          if (cancelled) return;
          setStreamStatus("connected");
            retryCount = 0;
          // Backfill from the engine's durable history on every (re)connect —
          // the agent's SSE broker is fire-and-forget, so anything emitted
          // while we were disconnected only exists in the persisted messages.
          // Idempotent: refreshMessages merges by event id.
          void refreshMessages().catch(() => {});
        },
        onEvent: (raw) => {
          if (cancelled) return;

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
                    createdAt: record?.timestamp ?? new Date().toISOString(),
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

          // If the event is a gate, question, or plan checklist, the agent has paused to wait for human input.
          if (
            parsed.event.type === "approval_gate" ||
            parsed.event.type === "attention_required" ||
            parsed.event.type === "question_choice" ||
            (parsed.event.type === "checklist" && /plan/i.test(parsed.event.data.title ?? ""))
          ) {
            setIsAwaitingResponse(false);
          }

          if (
            parsed.event.type === "approval_gate" ||
            parsed.event.type === "file_created"
          ) {
            setActiveOutputId(`event:${parsed.id}`);
          } else if (
            parsed.event.type === "checklist" &&
            /plan/i.test(parsed.event.data.title ?? "")
          ) {
            setActiveOutputId("artifact:plan");
          }

          setStreamEvents((current) => mergeStreamEvents(current, parsed));
        },
        onDone: () => {
          if (cancelled) return;
          setIsAwaitingResponse(false);
          void refreshMessages();
          if (isAwaitingResponseRef.current) {
            retryTimer = window.setTimeout(() => {
              if (!cancelled) void connect();
            }, 1500);
          } else {
            setStreamStatus("idle");
          }
        },
        onError: (error) => {
          if (cancelled) return;

          if (isPermanentStreamError(error)) {
            setStreamStatus("idle");
            return;
          }

          retryCount += 1;
          if (retryCount > 5) {
            setStreamStatus("idle");
            return;
          }

          setStreamStatus("error");
          retryTimer = window.setTimeout(() => {
            if (!cancelled) void connect();
          }, 4000 * retryCount);
        },
      });
    }

    void connect();

    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      unsubscribe?.();
    };
  }, [activityId, getToken, isAwaitingResponse, refreshMessages]);

  useEffect(() => {
    if (!isAwaitingResponse) return;

    const pollTimer = window.setInterval(() => {
      void refreshMessages();
    }, 2500);

    const timeoutTimer = window.setTimeout(() => {
      setIsAwaitingResponse(false);
    }, 120000);

    return () => {
      window.clearInterval(pollTimer);
      window.clearTimeout(timeoutTimer);
    };
  }, [isAwaitingResponse, refreshMessages]);

  const artifact = useMemo(
    () => buildArtifactFromStreamEvents(streamEvents, activity),
    [streamEvents, activity],
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

      try {
        const token = await getToken();
        await postActivityMessage(token, activityIdRef.current, trimmed);
        await refreshMessages();
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
    [getToken, refreshMessages],
  );

  const handlePlanDecision = useCallback(
    async (decision: PlanReviewDecision, gateId?: string) => {
      const token = await getToken();

      if (decision === "start_now") {
        setIsAwaitingResponse(true);
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

        toast.success("Plan rejected — LUCA will regenerate it");
        setIsAwaitingResponse(true);
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
        current.map((event) => {
          if (
            event.event.type !== "approval_gate" ||
            event.event.data.gateId !== gateId
          ) {
            return event;
          }

          return {
            ...event,
            event: {
              ...event.event,
              data: {
                ...event.event.data,
                status: payload.decision === "reject" ? "rejected" : "resolved",
              },
            },
          };
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
    isLoading,
    isSending,
    isAwaitingResponse,
    activeOutputId,
    setActiveOutputId,
    sendMessage,
    handlePlanDecision,
    handleApprovalDecision,
    refreshMessages,
    refreshActivity,
  };
}

export type UseActivitySessionReturn = ReturnType<typeof useActivitySession>;
