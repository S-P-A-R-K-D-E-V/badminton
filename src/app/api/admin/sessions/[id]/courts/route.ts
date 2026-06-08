import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CourtSchema } from '@/lib/validations'
import { getAdmin } from '@/lib/auth'

// POST /api/admin/sessions/:id/courts — add court to session
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = CourtSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const court = await prisma.court.create({
    data: { ...parsed.data, sessionId: params.id },
  })

  return NextResponse.json(court, { status: 201 })
}
