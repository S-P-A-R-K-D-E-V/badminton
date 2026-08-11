import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAgentAuthorized, agentUnauthorized } from '@/lib/agentAuth'
import { z } from 'zod'

const CostSchema = z.object({
  courtFee: z.number().int().min(0).default(0),
  shuttlecockCost: z.number().int().min(0).default(0),
  supplyCost: z.number().int().min(0).default(0),
  otherCost: z.number().int().min(0).default(0),
  note: z.string().optional(),
})

// GET /api/agent/sessions/:id/cost
export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!isAgentAuthorized(req)) return agentUnauthorized()

  const cost = await prisma.sessionCost.findUnique({ where: { sessionId: params.id } })
  return NextResponse.json(cost ?? null)
}

// PUT /api/agent/sessions/:id/cost — upsert, dùng được cho cả lịch cũ
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!isAgentAuthorized(req)) return agentUnauthorized()

  const session = await prisma.session.findUnique({ where: { id: params.id } })
  if (!session) return NextResponse.json({ error: 'Không tìm thấy lịch' }, { status: 404 })

  const body = await req.json()
  const parsed = CostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const cost = await prisma.sessionCost.upsert({
    where: { sessionId: params.id },
    create: { sessionId: params.id, ...data },
    update: data,
  })

  return NextResponse.json(cost)
}
