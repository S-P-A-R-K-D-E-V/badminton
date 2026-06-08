import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { RegisterSchema } from '@/lib/validations'
import { notifyCourtStatus } from '@/lib/bot'

// POST /api/sessions/:id/register — public
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { registrantName, registrantPhone, courtId, players } = parsed.data

  // Verify court belongs to this session and is open
  const court = await prisma.court.findFirst({
    where: { id: courtId, sessionId: params.id, session: { status: 'OPEN' } },
    include: {
      _count: { select: { registrations: { where: { status: 'CONFIRMED' } } } },
    },
  })

  if (!court) {
    return NextResponse.json({ error: 'Sân không tồn tại hoặc buổi đã đóng' }, { status: 400 })
  }

  const currentCount = court._count.registrations
  const afterCount = currentCount + players.length

  if (afterCount > court.maxSlots) {
    return NextResponse.json(
      {
        error: `Sân ${court.name} chỉ còn ${court.maxSlots - currentCount} chỗ trống`,
        availableSlots: court.maxSlots - currentCount,
      },
      { status: 409 }
    )
  }

  // Create registrations in transaction
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
        },
        select: {
          id: true,
          cancelToken: true,
          playerName: true,
          playerRank: true,
          court: { select: { name: true, session: { select: { title: true, date: true } } } },
        },
      })
    )
  )

  // Notify if threshold reached
  const newCount = currentCount + players.length
  if (newCount >= court.maxSlots || newCount >= court.warnAt) {
    notifyCourtStatus(court, newCount).catch(console.error)
  }

  return NextResponse.json({ registrations }, { status: 201 })
}
