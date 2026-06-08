import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { canCancelRegistration } from '@/lib/utils'

// GET /api/cancel/:token — preview info before cancel
export async function GET(_: Request, { params }: { params: { token: string } }) {
  const reg = await prisma.registration.findUnique({
    where: { cancelToken: params.token },
    include: {
      court: {
        include: { session: true },
      },
    },
  })

  if (!reg) return NextResponse.json({ error: 'Không tìm thấy đăng ký' }, { status: 404 })
  if (reg.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Đăng ký này đã được hủy' }, { status: 410 })
  }

  const canCancel = canCancelRegistration(reg.court.session.date, reg.court.session.startTime)

  return NextResponse.json({
    playerName: reg.playerName,
    courtName: reg.court.name,
    sessionTitle: reg.court.session.title,
    sessionDate: reg.court.session.date,
    canCancel,
  })
}

// DELETE /api/cancel/:token
export async function DELETE(_: Request, { params }: { params: { token: string } }) {
  const reg = await prisma.registration.findUnique({
    where: { cancelToken: params.token },
    include: {
      court: { include: { session: true } },
    },
  })

  if (!reg) return NextResponse.json({ error: 'Không tìm thấy đăng ký' }, { status: 404 })
  if (reg.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Đăng ký này đã được hủy' }, { status: 410 })
  }

  const canCancel = canCancelRegistration(reg.court.session.date, reg.court.session.startTime)
  if (!canCancel) {
    return NextResponse.json(
      { error: 'Đã quá hạn hủy (phải hủy trước 2h)' },
      { status: 403 }
    )
  }

  await prisma.registration.update({
    where: { id: reg.id },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  })

  return NextResponse.json({ ok: true, message: `Đã hủy đăng ký cho ${reg.playerName}` })
}
