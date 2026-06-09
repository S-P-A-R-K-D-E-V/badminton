import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAdmin } from '@/lib/auth'
import { addDays } from 'date-fns'

// POST /api/admin/sessions/:id/duplicate — copy sang tuần sau
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const daysOffset = body.daysOffset ?? 7 // default: +7 ngày (tuần sau)

  const original = await prisma.session.findUnique({
    where: { id: params.id },
    include: { courts: true },
  })

  if (!original) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const newSession = await prisma.session.create({
    data: {
      title: original.title,
      date: addDays(original.date, daysOffset),
      startTime: original.startTime,
      endTime: original.endTime,
      location: original.location,
      isRecurring: original.isRecurring,
      createdBy: admin.id,
      status: 'OPEN',
      courts: {
        create: original.courts.map((c) => ({
          name: c.name,
          maxSlots: c.maxSlots,
          warnAt: c.warnAt,
        })),
      },
    },
    include: { courts: true },
  })

  return NextResponse.json(newSession, { status: 201 })
}
