import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { costPerPersonFor } from '@/lib/session-cost'

import type { Prisma } from '@prisma/client'

const PAGE_SIZE = 5

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  const registrant = searchParams.get('registrant')?.trim()
  const phone = searchParams.get('phone')?.trim()
  const paid = searchParams.get('paid') // 'true' | 'false' | null
  const skip = Math.max(0, Number(searchParams.get('skip')) || 0)

  if (!q && !registrant && !phone) {
    return NextResponse.json(
      { error: 'Nhập tên người chơi, người đăng ký hoặc số điện thoại để tìm kiếm' },
      { status: 400 }
    )
  }

  const matchFilter: Prisma.RegistrationWhereInput = {
    status: 'CONFIRMED',
    ...(q ? { playerName: { contains: q, mode: 'insensitive' } } : {}),
    ...(registrant ? { registrantName: { contains: registrant, mode: 'insensitive' } } : {}),
    ...(phone ? { registrantPhone: { contains: phone } } : {}),
    ...(paid === 'true' ? { isPaid: true } : paid === 'false' ? { isPaid: false } : {}),
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
      const costPerPerson = costPerPersonFor(r.court.session)

      return {
        id: r.id,
        sessionId: r.court.sessionId,
        playerName: r.playerName,
        isProxy: r.isProxy,
        registrantName: r.registrantName,
        registrantPhone: r.registrantPhone,
        cancelToken: r.cancelToken,
        registeredAt: r.registeredAt,
        courtName: r.court.name,
        isPaid: r.isPaid,
        costPerPerson,
        hasCost: costPerPerson > 0,
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
