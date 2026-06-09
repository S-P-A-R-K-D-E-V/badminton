import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAdmin } from '@/lib/auth'

// POST /api/admin/registrations/:id/payment — toggle isPaid
export async function POST(_: Request, { params }: { params: { id: string } }) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const reg = await prisma.registration.findUnique({ where: { id: params.id } })
  if (!reg) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.registration.update({
    where: { id: params.id },
    data: {
      isPaid: !reg.isPaid,
      paidAt: !reg.isPaid ? new Date() : null,
    },
  })

  return NextResponse.json({ isPaid: updated.isPaid, paidAt: updated.paidAt })
}
