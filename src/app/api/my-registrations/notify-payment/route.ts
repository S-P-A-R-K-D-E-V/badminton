import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getBot } from '@/lib/bot'

const BANK_ID = 'MB'
const ACCOUNT_NO = '2510199966668'
const ACCOUNT_NAME = 'SPARK Badminton'
const CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? ''

function buildQrUrl(totalAmount: number, name: string, sessionDate: Date | string): string {
  const d = new Date(sessionDate)
  const day = String(d.getUTCDate()).padStart(2, '0')
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const year = d.getUTCFullYear()
  const addInfo = encodeURIComponent(`Cầu lông - ${name} ${day}${month}${year}`)
  return `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${totalAmount}&addInfo=${addInfo}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const { registrationIds, phone, name } = body ?? {}

  if (!Array.isArray(registrationIds) || registrationIds.length === 0 || !phone || !name) {
    return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 })
  }

  // Fetch and validate — only CONFIRMED, unpaid, belonging to this phone/name
  const registrations = await prisma.registration.findMany({
    where: {
      id: { in: registrationIds },
      registrantPhone: phone,
      registrantName: { equals: name, mode: 'insensitive' },
      status: 'CONFIRMED',
      isPaid: false,
    },
    include: {
      court: {
        include: {
          session: {
            select: {
              title: true,
              date: true,
              cost: true,
              courts: {
                select: {
                  _count: {
                    select: {
                      registrations: { where: { status: 'CONFIRMED' } },
                    },
                  },
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

  // Validate all sessions have cost set
  const missingCost = registrations.some((r) => {
    const cost = r.court.session.cost
    return !cost || cost.courtFee + cost.shuttlecockCost + cost.supplyCost + cost.otherCost === 0
  })
  if (missingCost) {
    return NextResponse.json({ error: 'Có buổi chơi chưa được chốt phí' }, { status: 400 })
  }

  // Group by session to calculate per-person cost
  const bySession = new Map<string, typeof registrations>()
  for (const r of registrations) {
    const sid = r.court.sessionId
    if (!bySession.has(sid)) bySession.set(sid, [])
    bySession.get(sid)!.push(r)
  }

  const lines: string[] = []
  let totalAmount = 0
  let earliestDate: Date | string = registrations[0].court.session.date

  for (const regs of Array.from(bySession.values())) {
    const session = regs[0].court.session
    const cost = session.cost!
    const totalCost = cost.courtFee + cost.shuttlecockCost + cost.supplyCost + cost.otherCost
    const confirmedCount = session.courts.reduce((sum, c) => sum + c._count.registrations, 0)
    const costPerPerson = confirmedCount > 0 ? Math.ceil(totalCost / confirmedCount) : 0

    const d = new Date(session.date)
    const dateStr = `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`

    // Track earliest session date for QR addInfo
    if (new Date(session.date) < new Date(earliestDate)) {
      earliestDate = session.date
    }

    lines.push(`📋 <b>${session.title}</b> (${dateStr})`)
    for (const r of regs) {
      const proxyNote = r.isProxy ? ' <i>(hộ)</i>' : ''
      lines.push(
        `   • ${r.playerName}${proxyNote} — ${costPerPerson.toLocaleString('vi-VN')}đ`
      )
      totalAmount += costPerPerson
    }
  }

  if (totalAmount === 0) {
    return NextResponse.json({ error: 'Không thể tính được chi phí' }, { status: 400 })
  }

  const qrUrl = buildQrUrl(totalAmount, name, earliestDate)

  // Create payment request record
  const payReq = await prisma.paymentRequest.create({
    data: {
      phone,
      name,
      registrationIds,
      totalAmount,
      status: 'PENDING',
    },
  })

  // Send Telegram notification
  const bot = getBot()
  if (bot && CHAT_ID) {
    const text =
      `💰 <b>Thông báo thanh toán</b>\n\n` +
      `👤 <b>${name}</b> (${phone})\n` +
      `xin xác nhận đã chuyển khoản:\n\n` +
      `${lines.join('\n')}\n\n` +
      `💵 Tổng: <b>${totalAmount.toLocaleString('vi-VN')}đ</b>\n` +
      `🏦 MB Bank · ${ACCOUNT_NO}`

    try {
      const msg = await bot.api.sendMessage(CHAT_ID, text, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Xác nhận đã trả', callback_data: `pay_confirm:${payReq.id}` },
              { text: '❌ Hủy', callback_data: `pay_cancel:${payReq.id}` },
            ],
          ],
        },
      })

      await prisma.paymentRequest.update({
        where: { id: payReq.id },
        data: { telegramMsgId: msg.message_id },
      })
    } catch (e) {
      console.error('[notify-payment] Telegram send failed:', e)
    }
  }

  return NextResponse.json({ id: payReq.id, qrUrl })
}
