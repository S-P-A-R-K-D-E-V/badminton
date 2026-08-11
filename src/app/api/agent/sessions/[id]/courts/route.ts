import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CourtSchema } from '@/lib/validations'
import { isAgentAuthorized, agentUnauthorized } from '@/lib/agentAuth'

// POST /api/agent/sessions/:id/courts — thêm sân vào 1 lịch (kể cả lịch cũ)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isAgentAuthorized(req)) return agentUnauthorized()

  const session = await prisma.session.findUnique({ where: { id: params.id } })
  if (!session) return NextResponse.json({ error: 'Không tìm thấy lịch' }, { status: 404 })

  const body = await req.json()
  const parsed = CourtSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const court = await prisma.court.create({
    data: { ...parsed.data, sessionId: params.id },
  })

  return NextResponse.json(court, { status: 201 })
}
