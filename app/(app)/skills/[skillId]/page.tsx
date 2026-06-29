import { SkillDetailView } from "@/components/skills/skill-detail-view"

type SkillDetailPageProps = {
  params: Promise<{ skillId: string }>
}

export default async function SkillDetailPage({ params }: SkillDetailPageProps) {
  const { skillId } = await params
  return <SkillDetailView skillId={skillId} />
}
