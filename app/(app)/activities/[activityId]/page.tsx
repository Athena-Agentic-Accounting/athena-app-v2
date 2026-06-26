import { ActivitySessionView } from "@/components/session/activity-session-view"

type ActivitySessionPageProps = {
  params: Promise<{ activityId: string }>
  searchParams: Promise<{ prompt?: string }>
}

export default async function ActivitySessionPage({
  params,
  searchParams,
}: ActivitySessionPageProps) {
  const { activityId } = await params
  const { prompt } = await searchParams

  return <ActivitySessionView activityId={activityId} initialPrompt={prompt ?? null} />
}
