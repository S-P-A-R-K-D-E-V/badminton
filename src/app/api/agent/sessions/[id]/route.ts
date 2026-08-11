import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { SessionSchema } from '@/lib/validations'
import { isAgentAuthorized, agentUnauthorized } from '@/lib/agentAuth'

// GET /api/agent/sessions/:id — chi tiết 1 lịch, gồm mọi trạng thái đăng ký + chi phí
export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!isAgentAuthorized(req)) return agentUnauthorized()

  const session = await prisma.session.findUnique({
    where: { id: params.id },
    include: {
      courts: {
        include: {
          registrations: { orderBy: { registeredAt: 'asc' } },
        },
      },
      cost: true,
    },
  })

  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(session)
}

// PUT /api/agent/sessions/:id — sửa lịch, kể cả lịch đã diễn ra trong quá khứ
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!isAgentAuthorized(req)) return agentUnauthorized()

  const body = await req.json()

  // Cho phép cập nhật riêng trạng thái mà không cần gửi đủ các trường khác
  if (body.status && Object.keys(body).length === 1) {
    if (!['OPEN', 'CLOSED', 'CANCELLED'].includes(body.status)) {
      return NextResponse.json({ error: 'Trạng thái không hợp lệ' }, { status: 400 })
    }
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
      ...(body.status && ['OPEN', 'CLOSED', 'CANCELLED'].includes(body.status)
        ? { status: body.status }
        : {}),
    },
  })

  return NextResponse.json(session)
}

// DELETE /api/agent/sessions/:id — xoá lịch (kể cả lịch cũ)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!isAgentAuthorized(req)) return agentUnauthorized()

  await prisma.session.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
