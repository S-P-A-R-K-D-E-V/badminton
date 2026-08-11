import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { SessionSchema, CourtSchema } from '@/lib/validations'
import { isAgentAuthorized, agentUnauthorized } from '@/lib/agentAuth'

// GET /api/agent/sessions — toàn bộ lịch (kể cả lịch cũ), có thể lọc theo query
// ?from=YYYY-MM-DD&to=YYYY-MM-DD&status=OPEN|CLOSED|CANCELLED
export async function GET(req: Request) {
  if (!isAgentAuthorized(req)) return agentUnauthorized()

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const status = searchParams.get('status')

  const sessions = await prisma.session.findMany({
    where: {
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
      ...(status ? { status: status as 'OPEN' | 'CLOSED' | 'CANCELLED' } : {}),
    },
    include: {
      courts: {
        include: {
          registrations: {
            orderBy: { registeredAt: 'asc' },
          },
          _count: {
            select: { registrations: { where: { status: 'CONFIRMED' } } },
          },
        },
      },
      cost: true,
    },
    orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
  })

  return NextResponse.json(sessions)
}

// POST /api/agent/sessions — tạo lịch mới, cho phép cả ngày trong quá khứ
export async function POST(req: Request) {
  if (!isAgentAuthorized(req)) return agentUnauthorized()

  const body = await req.json()
  const parsed = SessionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { title, date, startTime, endTime, location, isRecurring } = parsed.data
  const courts: { name: string; maxSlots: number; warnAt: number }[] = body.courts ?? []

  for (const c of courts) {
    const r = CourtSchema.safeParse(c)
    if (!r.success) {
      return NextResponse.json({ error: r.error.flatten() }, { status: 400 })
    }
  }

  const status = ['OPEN', 'CLOSED', 'CANCELLED'].includes(body.status) ? body.status : undefined

  const session = await prisma.session.create({
    data: {
      title,
      date: new Date(date),
      startTime: new Date(`1970-01-01T${startTime}:00`),
      endTime: new Date(`1970-01-01T${endTime}:00`),
      location,
      isRecurring,
      createdBy: 'agent',
      status,
      courts: courts.length > 0 ? { create: courts } : undefined,
    },
    include: { courts: true },
  })

  return NextResponse.json(session, { status: 201 })
}
