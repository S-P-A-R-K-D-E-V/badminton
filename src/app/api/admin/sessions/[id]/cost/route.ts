import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAdmin } from '@/lib/auth'
import { z } from 'zod'

const CostSchema = z.object({
  courtFee:        z.number().int().min(0).default(0),
  shuttlecockCost: z.number().int().min(0).default(0),
  supplyCost:      z.number().int().min(0).default(0),
  otherCost:       z.number().int().min(0).default(0),
  note:            z.string().optional(),
})

// GET /api/admin/sessions/:id/cost
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cost = await prisma.sessionCost.findUnique({ where: { sessionId: params.id } })
  return NextResponse.json(cost ?? null)
}

// PUT /api/admin/sessions/:id/cost — upsert
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
