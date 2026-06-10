import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name')?.trim()
  const phone = searchParams.get('phone')?.trim()

  if (!name || !phone) {
    return NextResponse.json({ error: 'Thiếu tên hoặc số điện thoại' }, { status: 400 })
  }

  const registrations = await prisma.registration.findMany({
    where: {
      registrantName: { equals: name, mode: 'insensitive' },
      registrantPhone: phone,
      status: 'CONFIRMED',
    },
    include: {
      court: {
        include: {
          session: {
            select: {
              title: true,
              date: true,
              startTime: true,
              location: true,
              status: true,
              cost: true,
              courts: {
                select: {
                  _count: {
                    select: {
                      registrations: { where: { status: 'CONFIRMED' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { registeredAt: 'desc' },
    take: 20,
  })

  return NextResponse.json(
    registrations.map((r) => {
      const cost = r.court.session.cost
      const totalCost = cost
        ? cost.courtFee + cost.shuttlecockCost + cost.supplyCost + cost.otherCost
        : 0
      const confirmedCount = r.court.session.courts.reduce(
        (sum, c) => sum + c._count.registrations,
        0
      )
      const costPerPerson =
        confirmedCount > 0 && totalCost > 0 ? Math.ceil(totalCost / confirmedCount) : 0

      return {
        id: r.id,
        sessionId: r.court.sessionId,
        playerName: r.playerName,
        isProxy: r.isProxy,
        cancelToken: r.cancelToken,
        registeredAt: r.registeredAt,
        courtName: r.court.name,
        isPaid: r.isPaid,
        costPerPerson,
        hasCost: !!cost && totalCost > 0,
        session: {
          title: r.court.session.title,
          date: r.court.session.date,
          startTime: r.court.session.startTime,
          location: r.court.session.location,
          status: r.court.session.status,
        },
      }
    })
  )
}
