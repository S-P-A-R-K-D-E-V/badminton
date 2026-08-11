import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { AgentAddPlayersSchema } from '@/lib/validations'
import { isAgentAuthorized, agentUnauthorized } from '@/lib/agentAuth'

// POST /api/agent/sessions/:id/players — thêm người chơi trực tiếp vào 1 sân,
// không giới hạn bởi trạng thái lịch (OPEN/CLOSED) hay số slot còn trống —
// dùng để agent bổ sung người cho cả lịch cũ.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isAgentAuthorized(req)) return agentUnauthorized()

  const body = await req.json()
  const parsed = AgentAddPlayersSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { courtId, registrantName, registrantPhone, players, status } = parsed.data

  const court = await prisma.court.findFirst({
    where: { id: courtId, sessionId: params.id },
  })
  if (!court) {
    return NextResponse.json({ error: 'Sân không tồn tại trong lịch này' }, { status: 400 })
  }

  const registrations = await prisma.$transaction(
    players.map((p) =>
      prisma.registration.create({
        data: {
          courtId,
          registrantName,
          registrantPhone,
          playerName: p.playerName,
          playerGender: p.playerGender,
          playerRank: p.playerRank,
          isProxy: players.length > 1 || p.playerName !== registrantName,
          status,
        },
      })
    )
  )

  return NextResponse.json({ registrations }, { status: 201 })
}
