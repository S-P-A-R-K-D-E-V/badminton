import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { SessionSchema, CourtSchema } from '@/lib/validations'
import { getAdmin } from '@/lib/auth'

// GET /api/sessions — public: list upcoming sessions
export async function GET() {
  const sessions = await prisma.session.findMany({
    where: {
      date: { gte: new Date() },
      status: { not: 'CANCELLED' },
    },
    include: {
      courts: {
        include: {
          _count: {
            select: { registrations: { where: { status: 'CONFIRMED' } } },
          },
        },
      },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })

  return NextResponse.json(sessions)
}

// POST /api/sessions — admin only
export async function POST(req: Request) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = SessionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { title, date, startTime, endTime, location, isRecurring } = parsed.data
  const courts: { name: string; maxSlots: number; warnAt: number }[] = body.courts ?? []

  // Validate courts if provided
  for (const c of courts) {
    const r = CourtSchema.safeParse(c)
    if (!r.success) {
      return NextResponse.json({ error: r.error.flatten() }, { status: 400 })
    }
  }

  const session = await prisma.session.create({
    data: {
      title,
      date: new Date(date),
      startTime: new Date(`1970-01-01T${startTime}:00`),
      endTime: new Date(`1970-01-01T${endTime}:00`),
      location,
      isRecurring,
      createdBy: admin.id,
      courts: courts.length > 0 ? { create: courts } : undefined,
    },
    include: { courts: true },
  })

  return NextResponse.json(session, { status: 201 })
}
