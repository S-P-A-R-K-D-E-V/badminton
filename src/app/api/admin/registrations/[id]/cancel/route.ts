import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAdmin } from '@/lib/auth'

// POST /api/admin/registrations/:id/cancel — admin force cancel
export async function POST(_: Request, { params }: { params: { id: string } }) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const reg = await prisma.registration.update({
    where: { id: params.id },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
    select: { id: true, playerName: true },
  })

  return NextResponse.json({ ok: true, playerName: reg.playerName })
}
