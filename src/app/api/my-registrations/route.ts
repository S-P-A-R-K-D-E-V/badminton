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
            select: { title: true, date: true, startTime: true, location: true, status: true },
          },
        },
      },
    },
    orderBy: { registeredAt: 'desc' },
    take: 20,
  })

  return NextResponse.json(
    registrations.map((r) => ({
      id: r.id,
      playerName: r.playerName,
      isProxy: r.isProxy,
      cancelToken: r.cancelToken,
      registeredAt: r.registeredAt,
      courtName: r.court.name,
      session: r.court.session,
    }))
  )
}
