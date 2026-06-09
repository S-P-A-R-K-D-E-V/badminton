import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { SessionSchema } from '@/lib/validations'
import { getAdmin } from '@/lib/auth'

// GET /api/sessions/:id — public
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await prisma.session.findUnique({
    where: { id: params.id },
    include: {
      courts: {
        include: {
          registrations: {
            where: { status: 'CONFIRMED' },
            select: {
              id: true,
              playerName: true,
              playerGender: true,
              playerRank: true,
              isProxy: true,
              registrantName: true,
              registeredAt: true,
            },
            orderBy: { registeredAt: 'asc' },
          },
          _count: {
            select: { registrations: { where: { status: 'CONFIRMED' } } },
          },
          waitlist: {
            where: { status: 'WAITLIST' },
            select: { id: true },
          },
        },
      },
    },
  })

  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Map waitlist count per court
  const response = {
    ...session,
    courts: session.courts.map((c) => ({
      ...c,
      waitlistCount: c.waitlist.length,
      waitlist: undefined,
    })),
  }
  return NextResponse.json(response)
}

// PUT /api/sessions/:id — admin only
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Allow partial status update
  if (body.status) {
    const session = await prisma.session.update({
      where: { id: params.id },
      data: { status: body.status },
    })
    return NextResponse.json(session)
  }

  const parsed = SessionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { title, date, startTime, endTime, location, isRecurring } = parsed.data
  const session = await prisma.session.update({
    where: { id: params.id },
    data: {
      title,
      date: new Date(date),
      startTime: new Date(`1970-01-01T${startTime}:00`),
      endTime: new Date(`1970-01-01T${endTime}:00`),
      location,
      isRecurring,
    },
  })

  return NextResponse.json(session)
}

// DELETE /api/sessions/:id — admin only
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.session.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
