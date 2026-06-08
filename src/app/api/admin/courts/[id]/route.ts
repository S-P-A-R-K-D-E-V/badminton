import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAdmin } from '@/lib/auth'

// DELETE /api/admin/courts/:id
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.court.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
