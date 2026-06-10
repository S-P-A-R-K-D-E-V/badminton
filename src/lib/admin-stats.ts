import { subMonths, startOfMonth, format } from 'date-fns'

import { prisma } from './db'

// ----------------------------------------------------------------------

export type MonthlyPoint = {
  month: string // "MM/yyyy"
  sessions: number
  cost: number
}

export type AdminStats = {
  sessionsThisMonth: number
  confirmedPlayers: number
  avgFillRate: number // 0-100, trung bình N buổi gần nhất
  unpaidCount: number
  paidCount: number
  monthly: MonthlyPoint[]
}

const MONTHS_RANGE = 6
const FILL_RATE_SAMPLE = 10

export async function getAdminStats(): Promise<AdminStats> {
  const now = new Date()
  const since = startOfMonth(subMonths(now, MONTHS_RANGE - 1))
  const startThisMonth = startOfMonth(now)
  const today = new Date(now.toDateString())

  const [sessionsByMonth, costByMonth, sessionsThisMonth, recentSessions, paymentGroups] =
    await Promise.all([
      prisma.$queryRaw<{ month: Date; count: number }[]>`
        SELECT date_trunc('month', "date") AS month, COUNT(*)::int AS count
        FROM "Session"
        WHERE "date" >= ${since} AND status != 'CANCELLED'
        GROUP BY 1
        ORDER BY 1
      `,
      prisma.$queryRaw<{ month: Date; total: number }[]>`
        SELECT date_trunc('month', s."date") AS month,
               SUM(c."courtFee" + c."shuttlecockCost" + c."supplyCost" + c."otherCost")::int AS total
        FROM "SessionCost" c
        JOIN "Session" s ON s.id = c."sessionId"
        WHERE s."date" >= ${since}
        GROUP BY 1
        ORDER BY 1
      `,
      prisma.session.count({
        where: { date: { gte: startThisMonth }, status: { not: 'CANCELLED' } },
      }),
      prisma.session.findMany({
        where: { status: { not: 'CANCELLED' }, date: { lte: today } },
        orderBy: { date: 'desc' },
        take: FILL_RATE_SAMPLE,
        include: {
          courts: {
            include: {
              _count: { select: { registrations: { where: { status: 'CONFIRMED' } } } },
            },
          },
        },
      }),
      prisma.registration.groupBy({
        by: ['isPaid'],
        _count: { _all: true },
        where: {
          status: 'CONFIRMED',
          court: { session: { date: { lt: today }, status: { not: 'CANCELLED' } } },
        },
      }),
    ])

  // Zero-fill 6 tháng gần nhất
  const monthly: MonthlyPoint[] = Array.from({ length: MONTHS_RANGE }).map((_, i) => {
    const m = startOfMonth(subMonths(now, MONTHS_RANGE - 1 - i))
    const key = format(m, 'MM/yyyy')
    const sessions =
      sessionsByMonth.find((r) => format(new Date(r.month), 'MM/yyyy') === key)?.count ?? 0
    const cost = costByMonth.find((r) => format(new Date(r.month), 'MM/yyyy') === key)?.total ?? 0
    return { month: key, sessions, cost }
  })

  // Tỷ lệ lấp đầy trung bình của các buổi đã diễn ra gần nhất
  const fillRates = recentSessions
    .map((s) => {
      const slots = s.courts.reduce((sum, c) => sum + c.maxSlots, 0)
      const booked = s.courts.reduce((sum, c) => sum + c._count.registrations, 0)
      return slots > 0 ? booked / slots : null
    })
    .filter((v): v is number => v !== null)
  const avgFillRate =
    fillRates.length > 0
      ? Math.round((fillRates.reduce((a, b) => a + b, 0) / fillRates.length) * 100)
      : 0

  const paidCount = paymentGroups.find((g) => g.isPaid)?._count._all ?? 0
  const unpaidCount = paymentGroups.find((g) => !g.isPaid)?._count._all ?? 0

  const confirmedPlayers = await prisma.registration.count({
    where: {
      status: 'CONFIRMED',
      court: { session: { date: { gte: startThisMonth }, status: { not: 'CANCELLED' } } },
    },
  })

  return { sessionsThisMonth, confirmedPlayers, avgFillRate, unpaidCount, paidCount, monthly }
}
