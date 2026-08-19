type SessionForCost = {
  cost: {
    courtFee: number
    shuttlecockCost: number
    supplyCost: number
    otherCost: number
  } | null
  courts: { _count: { registrations: number } }[]
}

export function costPerPersonFor(session: SessionForCost): number {
  const cost = session.cost
  if (!cost) return 0
  const totalCost = cost.courtFee + cost.shuttlecockCost + cost.supplyCost + cost.otherCost
  if (totalCost <= 0) return 0
  const confirmedCount = session.courts.reduce((sum, c) => sum + c._count.registrations, 0)
  return confirmedCount > 0 ? Math.ceil(totalCost / confirmedCount) : 0
}
