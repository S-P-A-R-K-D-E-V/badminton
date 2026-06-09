import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { RegisterSchema } from '@/lib/validations'
import { notifyCourtStatus, sendPersonalCancelLink } from '@/lib/bot'

// POST /api/sessions/:id/register — public
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { registrantName, registrantPhone, courtId, players } = parsed.data

  const court = await prisma.court.findFirst({
    where: { id: courtId, sessionId: params.id, session: { status: 'OPEN' } },
    include: {
      _count: {
        select: {
          registrations: { where: { status: 'CONFIRMED' } },
        },
      },
    },
  })

  if (!court) {
    return NextResponse.json({ error: 'Sân không tồn tại hoặc buổi đã đóng' }, { status: 400 })
  }

  const confirmedCount = court._count.registrations
  const availableSlots = court.maxSlots - confirmedCount

  // Determine status for each player
  let confirmedPlayers = players.length
  let waitlistPlayers = 0

  if (availableSlots <= 0) {
    // All go to waitlist
    confirmedPlayers = 0
    waitlistPlayers = players.length
  } else if (players.length > availableSlots) {
    // Partial: some confirmed, rest waitlisted
    confirmedPlayers = availableSlots
    waitlistPlayers = players.length - availableSlots
  }

  const registrations = await prisma.$transaction(
    players.map((p, idx) => {
      const status = idx < confirmedPlayers ? 'CONFIRMED' : 'WAITLIST'
      return prisma.registration.create({
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
        select: {
          id: true,
          cancelToken: true,
          playerName: true,
          playerRank: true,
          status: true,
          court: { select: { name: true, session: { select: { title: true, date: true } } } },
        },
      })
    })
  )

  const newConfirmedCount = confirmedCount + confirmedPlayers
  if (newConfirmedCount >= court.maxSlots || newConfirmedCount >= court.warnAt) {
    notifyCourtStatus(court, newConfirmedCount).catch(console.error)
  }

  // Gửi DM Telegram nếu registrantPhone đã liên kết
  const normalizedPhone = registrantPhone.replace(/\D/g, '').replace(/^84/, '0')
  prisma.telegramUser.findUnique({ where: { phone: normalizedPhone } })
    .then((tgUser) => {
      if (!tgUser) return
      const firstReg = registrations[0]
      sendPersonalCancelLink(
        tgUser.chatId,
        registrations.map((r) => ({ playerName: r.playerName, cancelToken: r.cancelToken, status: r.status })),
        firstReg.court.session.title,
        firstReg.court.name
      )
    })
    .catch(console.error)

  return NextResponse.json(
    {
      registrations,
      waitlistCount: waitlistPlayers,
      confirmedCount: confirmedPlayers,
    },
    { status: 201 }
  )
}
