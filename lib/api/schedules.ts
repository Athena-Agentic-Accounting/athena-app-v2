import { backendRequest } from "@/lib/api/backend-client"
import { unwrapList, unwrapRecord } from "@/lib/api/unwrap"
import type {
  CreateScheduleRequest,
  ScheduleRecord,
  ScheduleRun,
  UpdateScheduleRequest,
} from "@/lib/schedules/types"

export async function listSchedules(
  token: string | null,
  clientId?: string | null,
): Promise<ScheduleRecord[]> {
  const query = clientId ? `?clientId=${encodeURIComponent(clientId)}` : ""
  const data = await backendRequest<{ schedules?: ScheduleRecord[] } | ScheduleRecord[]>(
    `/api/schedules${query}`,
    { token },
  )

  return unwrapList(data, ["schedules"])
}

export async function getSchedule(
  token: string | null,
  scheduleId: string,
): Promise<ScheduleRecord> {
  const data = await backendRequest<{ schedule?: ScheduleRecord } | ScheduleRecord>(
    `/api/schedules/${encodeURIComponent(scheduleId)}`,
    { token },
  )

  return unwrapRecord(data, ["schedule"])
}

export async function createSchedule(
  token: string | null,
  body: CreateScheduleRequest,
): Promise<ScheduleRecord> {
  const data = await backendRequest<{ schedule?: ScheduleRecord } | ScheduleRecord>(
    "/api/schedules",
    {
      method: "POST",
      token,
      body,
    },
  )

  return unwrapRecord(data, ["schedule"])
}

export async function updateSchedule(
  token: string | null,
  scheduleId: string,
  body: UpdateScheduleRequest,
): Promise<ScheduleRecord> {
  const data = await backendRequest<{ schedule?: ScheduleRecord } | ScheduleRecord>(
    `/api/schedules/${encodeURIComponent(scheduleId)}`,
    {
      method: "PATCH",
      token,
      body,
    },
  )

  return unwrapRecord(data, ["schedule"])
}

export async function deleteSchedule(
  token: string | null,
  scheduleId: string,
): Promise<void> {
  await backendRequest(`/api/schedules/${encodeURIComponent(scheduleId)}`, {
    method: "DELETE",
    token,
  })
}

export async function listScheduleRuns(
  token: string | null,
  scheduleId: string,
): Promise<ScheduleRun[]> {
  const data = await backendRequest<{ runs?: ScheduleRun[] } | ScheduleRun[]>(
    `/api/schedules/${encodeURIComponent(scheduleId)}/runs`,
    { token },
  )

  return unwrapList(data, ["runs"])
}

export function resolveScheduleRunActivityId(run: ScheduleRun): string | undefined {
  return run.activityId ?? run.activity_id
}
