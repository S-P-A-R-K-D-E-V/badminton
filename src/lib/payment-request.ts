import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db'
import { getBot } from '@/lib/bot'
import { generatePaymentCode } from '@/lib/payment-qr'
import { costPerPersonFor } from '@/lib/session-cost'

const CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? ''

export class PaymentRequestError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

// Reserves a short, unique payment code up front — before any money has
// moved — so the VietQR "content" field can stay short (BAD-XXXXXX) while
// still being traceable back to these exact registrations later.
export async function createPaymentRequest(registrationIds: string[]) {
  if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
    throw new PaymentRequestError('Thiếu danh sách đăng ký')
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
    throw new PaymentRequestError('Một số đăng ký không hợp lệ hoặc đã được thanh toán')
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
      throw new PaymentRequestError('Có buổi chơi chưa được chốt phí')
    }
    totalAmount += costPerPerson * regs.length
  }

  const name = Array.from(new Set(registrations.map((r) => r.registrantName))).join(', ')
  const phone = Array.from(new Set(registrations.map((r) => r.registrantPhone))).join(', ')

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.paymentRequest.create({
        data: { code: generatePaymentCode(), phone, name, registrationIds, totalAmount },
      })
    } catch (e) {
      const isCodeCollision = e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
      if (!isCodeCollision) throw e
    }
  }

  throw new PaymentRequestError('Không thể tạo mã thanh toán, thử lại', 500)
}

// Sends the Telegram confirm/reject message for an already-created,
// still-PENDING PaymentRequest. Returns whether the Telegram send itself
// succeeded — bot/network hiccups are reported, not thrown, so a caller can
// decide whether that should still count as an overall success.
export async function sendPaymentTelegramNotification(paymentRequestId: string) {
  const payReq = await prisma.paymentRequest.findUnique({ where: { id: paymentRequestId } })
  if (!payReq || payReq.status !== 'PENDING') {
    throw new PaymentRequestError('Yêu cầu thanh toán không hợp lệ', 404)
  }

  const registrations = await prisma.registration.findMany({
    where: { id: { in: payReq.registrationIds } },
    include: { court: { include: { session: { select: { title: true, date: true } } } } },
  })

  if (registrations.some((r) => r.status !== 'CONFIRMED' || r.isPaid)) {
    throw new PaymentRequestError(
      'Một số đăng ký đã được thanh toán hoặc hủy, tra cứu lại để cập nhật'
    )
  }

  const bySession = new Map<string, typeof registrations>()
  for (const r of registrations) {
    const sid = r.court.sessionId
    if (!bySession.has(sid)) bySession.set(sid, [])
    bySession.get(sid)!.push(r)
  }

  const lines: string[] = []
  for (const regs of Array.from(bySession.values())) {
    const session = regs[0].court.session
    const d = new Date(session.date)
    const dateStr = `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    lines.push(`📋 <b>${session.title}</b> (${dateStr})`)
    for (const r of regs) {
      const proxyNote = r.isProxy ? ' <i>(hộ)</i>' : ''
      lines.push(`   • ${r.playerName}${proxyNote}`)
    }
  }

  let telegramSent = false
  const bot = getBot()
  if (bot && CHAT_ID) {
    const text =
      `💰 <b>Thông báo thanh toán</b>\n\n` +
      `👤 <b>${payReq.name}</b> (${payReq.phone})\n` +
      `xin xác nhận đã chuyển khoản (mã: <b>${payReq.code}</b>):\n\n` +
      `${lines.join('\n')}\n\n` +
      `💵 Tổng: <b>${payReq.totalAmount.toLocaleString('vi-VN')}đ</b>\n` +
      `🏦 MB Bank`

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
      telegramSent = true
    } catch (e) {
      console.error('[payment-request] Telegram send failed:', e)
    }
  }

  return { payReq, telegramSent }
}
