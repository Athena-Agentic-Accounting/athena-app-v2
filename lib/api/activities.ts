import { backendRequest } from "@/lib/api/backend-client";
import {
  postAgentActivityMessage,
  subscribeAgentActivityStream,
} from "@/lib/api/activity-session";
import type { ActivityBoardResponse } from "@/lib/activities/board-types";
import type {
  ActivityMessage,
  ActivityPromptResponse,
  ActivityRecord,
  CreateActivityRequest,
  CreateActivityResult,
  UpdateActivityRequest,
  UpdateActivityStatusRequest,
} from "@/lib/activities/types";
import type { ScheduleRecord } from "@/lib/schedules/types";

import { unwrapList, unwrapRecord } from "@/lib/api/unwrap";

export async function getActivityBoard(
  token: string | null,
  clientId?: string | null,
): Promise<ActivityBoardResponse> {
  const query = clientId ? `?clientId=${encodeURIComponent(clientId)}` : "";
  return backendRequest<ActivityBoardResponse>(
    `/api/activities/board${query}`,
    {
      token,
    },
  );
}

export async function createActivity(
  token: string | null,
  body: CreateActivityRequest,
): Promise<CreateActivityResult> {
  const data = await backendRequest<
    | { activity?: ActivityRecord; schedule?: ScheduleRecord }
    | ActivityRecord
    | ScheduleRecord
  >("/api/activities", {
    method: "POST",
    token,
    body,
  });

  if (data && typeof data === "object" && "schedule" in data && data.schedule) {
    return {
      kind: "schedule",
      schedule: unwrapRecord<ScheduleRecord>(data, ["schedule"]),
    };
  }

  return {
    kind: "activity",
    activity: unwrapRecord<ActivityRecord>(data, ["activity"]),
  };
}

export async function submitActivityPrompt(
  token: string | null,
  body: { clientId: string; prompt: string; mode?: "default" | "query" },
): Promise<ActivityPromptResponse> {
  return backendRequest<ActivityPromptResponse>("/api/activities/prompt", {
    method: "POST",
    token,
    body,
  });
}

export async function getActivity(
  token: string | null,
  activityId: string,
): Promise<ActivityRecord> {
  const data = await backendRequest<
    { activity?: ActivityRecord } | ActivityRecord
  >(`/api/activities/${encodeURIComponent(activityId)}`, { token });

  return unwrapRecord(data, ["activity"]);
}

export async function getActivityAudit(
  token: string | null,
  activityId: string,
): Promise<unknown> {
  return backendRequest(
    `/api/activities/${encodeURIComponent(activityId)}/audit`,
    {
      token,
    },
  );
}

export async function updateActivity(
  token: string | null,
  activityId: string,
  body: UpdateActivityRequest,
): Promise<ActivityRecord> {
  const data = await backendRequest<
    { activity?: ActivityRecord } | ActivityRecord
  >(`/api/activities/${encodeURIComponent(activityId)}`, {
    method: "PATCH",
    token,
    body,
  });

  return unwrapRecord(data, ["activity"]);
}

export async function updateActivityStatus(
  token: string | null,
  activityId: string,
  body: UpdateActivityStatusRequest,
): Promise<ActivityRecord> {
  const data = await backendRequest<
    { activity?: ActivityRecord } | ActivityRecord
  >(`/api/activities/${encodeURIComponent(activityId)}/status`, {
    method: "POST",
    token,
    body,
  });

  return unwrapRecord(data, ["activity"]);
}

export async function confirmActivityPlan(
  token: string | null,
  activityId: string,
): Promise<ActivityRecord> {
  const data = await backendRequest<
    { activity?: ActivityRecord } | ActivityRecord
  >(`/api/activities/${encodeURIComponent(activityId)}/confirm-plan`, {
    method: "POST",
    token,
  });

  return unwrapRecord(data, ["activity"]);
}

export async function linkActivityPlan(
  token: string | null,
  activityId: string,
  planUrl: string,
): Promise<ActivityRecord> {
  const data = await backendRequest<
    { activity?: ActivityRecord } | ActivityRecord
  >(`/api/activities/${encodeURIComponent(activityId)}/link-plan`, {
    method: "POST",
    token,
    body: { planUrl },
  });

  return unwrapRecord(data, ["activity"]);
}

export async function getActivityMessages(
  token: string | null,
  activityId: string,
  params?: { limit?: number; offset?: number },
): Promise<ActivityMessage[]> {
  const search = new URLSearchParams();
  if (params?.limit !== undefined) search.set("limit", String(params.limit));
  if (params?.offset !== undefined) search.set("offset", String(params.offset));
  const query = search.toString() ? `?${search.toString()}` : "";

  const data = await backendRequest<
    { messages?: ActivityMessage[] } | ActivityMessage[]
  >(`/api/activities/${encodeURIComponent(activityId)}/messages${query}`, {
    token,
  });

  return unwrapList(data, ["messages"]);
}

export async function postActivityMessage(
  token: string | null,
  activityId: string,
  content: string,
): Promise<ActivityMessage> {
  return postAgentActivityMessage(token, activityId, content);
}

export type ActivityStreamHandlers = {
  onEvent: (event: unknown) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  onDone?: () => void;
};

/** Subscribe to live GenUI SSE events for an activity. Returns an abort function. */
export function subscribeActivityStream(
  token: string | null,
  activityId: string,
  handlers: ActivityStreamHandlers,
): () => void {
  return subscribeAgentActivityStream(token, activityId, handlers);
}
