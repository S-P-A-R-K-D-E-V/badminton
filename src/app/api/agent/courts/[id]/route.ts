import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CourtSchema } from '@/lib/validations'
import { isAgentAuthorized, agentUnauthorized } from '@/lib/agentAuth'

// PUT /api/agent/courts/:id — sửa 1 sân (tên/số slot/ngưỡng cảnh báo)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!isAgentAuthorized(req)) return agentUnauthorized()

  const body = await req.json()
  const parsed = CourtSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const court = await prisma.court.update({
    where: { id: params.id },
    data: parsed.data,
  })

  return NextResponse.json(court)
}

// DELETE /api/agent/courts/:id — xoá sân (và toàn bộ đăng ký thuộc sân đó)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!isAgentAuthorized(req)) return agentUnauthorized()

  await prisma.court.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
