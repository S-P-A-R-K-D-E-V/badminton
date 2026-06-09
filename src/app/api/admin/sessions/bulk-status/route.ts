import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAdmin } from '@/lib/auth'
import { z } from 'zod'

const BulkStatusSchema = z.object({
  ids: z.array(z.string()).min(1),
  status: z.enum(['CLOSED', 'CANCELLED']),
})

export async function POST(req: Request) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = BulkStatusSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { ids, status } = parsed.data

  const result = await prisma.session.updateMany({
    where: { id: { in: ids } },
    data: { status },
  })

  return NextResponse.json({ updated: result.count })
}
