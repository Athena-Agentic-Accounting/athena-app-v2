export type SkillTaskStep = {
  order: number
  task: string
  details?: string
}

export type SkillApprovalGate = {
  afterTaskOrder: number
  gateType: string
  description: string
}
