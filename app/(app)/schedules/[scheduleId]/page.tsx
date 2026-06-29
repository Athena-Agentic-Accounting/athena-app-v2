import { ScheduleDetailView } from "@/components/schedules/schedule-detail-view"

type ScheduleDetailPageProps = {
  params: Promise<{ scheduleId: string }>
}

export default async function ScheduleDetailPage({ params }: ScheduleDetailPageProps) {
  const { scheduleId } = await params
  return <ScheduleDetailView scheduleId={scheduleId} />
}
