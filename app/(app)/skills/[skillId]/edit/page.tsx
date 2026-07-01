import { SkillEditView } from "@/components/skills/skill-edit-view"

type SkillEditPageProps = {
  params: Promise<{ skillId: string }>
}

export default async function SkillEditPage({ params }: SkillEditPageProps) {
  const { skillId } = await params
  return <SkillEditView skillId={skillId} />
}
