import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { AgentUpdateRegistrationSchema } from '@/lib/validations'
import { isAgentAuthorized, agentUnauthorized } from '@/lib/agentAuth'

// PUT /api/agent/registrations/:id — sửa tên người chơi/người đăng ký/hạng/trạng thái/đã thanh toán
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!isAgentAuthorized(req)) return agentUnauthorized()

  const body = await req.json()
  const parsed = AgentUpdateRegistrationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { status, isPaid, ...rest } = parsed.data

  const existing = await prisma.registration.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const registration = await prisma.registration.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(status ? { status, ...(status === 'CANCELLED' ? { cancelledAt: new Date() } : {}) } : {}),
      ...(isPaid !== undefined ? { isPaid, paidAt: isPaid ? new Date() : null } : {}),
    },
  })

  return NextResponse.json(registration)
}

// DELETE /api/agent/registrations/:id — huỷ đăng ký (soft delete, giữ lịch sử)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!isAgentAuthorized(req)) return agentUnauthorized()

  const { searchParams } = new URL(req.url)
  const hard = searchParams.get('hard') === 'true'

  if (hard) {
    await prisma.registration.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true, hard: true })
  }

  const registration = await prisma.registration.update({
    where: { id: params.id },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  })

  return NextResponse.json({ ok: true, registration })
}
