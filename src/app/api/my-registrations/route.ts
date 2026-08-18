import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const PAGE_SIZE = 5

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name')?.trim()
  const phone = searchParams.get('phone')?.trim()
  const skip = Math.max(0, Number(searchParams.get('skip')) || 0)

  if (!name || !phone) {
    return NextResponse.json({ error: 'Thiếu tên hoặc số điện thoại' }, { status: 400 })
  }

  const matchFilter = {
    registrantName: { equals: name, mode: 'insensitive' as const },
    registrantPhone: phone,
    status: 'CONFIRMED' as const,
  }

  // Paginate by distinct session (newest first) so each page returns whole,
  // never-partial session groups for the infinite scroll list.
  const sessions = await prisma.session.findMany({
    where: { courts: { some: { registrations: { some: matchFilter } } } },
    select: { id: true },
    orderBy: { date: 'desc' },
    skip,
    take: PAGE_SIZE + 1,
  })

  const hasMore = sessions.length > PAGE_SIZE
  const pageSessionIds = sessions.slice(0, PAGE_SIZE).map((s) => s.id)

  if (pageSessionIds.length === 0) {
    return NextResponse.json({ registrations: [], hasMore: false })
  }

  const registrations = await prisma.registration.findMany({
    where: { ...matchFilter, court: { sessionId: { in: pageSessionIds } } },
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
  })

  return NextResponse.json({
    registrations: registrations.map((r) => {
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
    }),
    hasMore,
  })
}
