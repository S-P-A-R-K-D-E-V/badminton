import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db'
import { generatePaymentCode } from '@/lib/payment-qr'
import { costPerPersonFor } from '@/lib/session-cost'

// Reserves a short, unique payment code up front — before any money has
// moved — so the VietQR "content" field can stay short (BAD-XXXXXX) while
// still being traceable back to these exact registrations later.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const registrationIds = body?.registrationIds

  if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
    return NextResponse.json({ error: 'Thiếu danh sách đăng ký' }, { status: 400 })
  }

  const registrations = await prisma.registration.findMany({
    where: { id: { in: registrationIds }, status: 'CONFIRMED', isPaid: false },
    include: {
      court: {
        include: {
          session: {
            select: {
              cost: true,
              courts: {
                select: {
                  _count: { select: { registrations: { where: { status: 'CONFIRMED' } } } },
                },
              },
            },
          },
        },
      },
    },
  })

  if (registrations.length !== registrationIds.length) {
    return NextResponse.json(
      { error: 'Một số đăng ký không hợp lệ hoặc đã được thanh toán' },
      { status: 400 }
    )
  }

  const bySession = new Map<string, typeof registrations>()
  for (const r of registrations) {
    const sid = r.court.sessionId
    if (!bySession.has(sid)) bySession.set(sid, [])
    bySession.get(sid)!.push(r)
  }

  let totalAmount = 0
  for (const regs of Array.from(bySession.values())) {
    const costPerPerson = costPerPersonFor(regs[0].court.session)
    if (costPerPerson === 0) {
      return NextResponse.json({ error: 'Có buổi chơi chưa được chốt phí' }, { status: 400 })
    }
    totalAmount += costPerPerson * regs.length
  }

  const name = Array.from(new Set(registrations.map((r) => r.registrantName))).join(', ')
  const phone = Array.from(new Set(registrations.map((r) => r.registrantPhone))).join(', ')

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const payReq = await prisma.paymentRequest.create({
        data: {
          code: generatePaymentCode(),
          phone,
          name,
          registrationIds,
          totalAmount,
        },
      })
      return NextResponse.json({ id: payReq.id, code: payReq.code, totalAmount: payReq.totalAmount })
    } catch (e) {
      const isCodeCollision = e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
      if (!isCodeCollision) throw e
    }
  }

  return NextResponse.json({ error: 'Không thể tạo mã thanh toán, thử lại' }, { status: 500 })
}
