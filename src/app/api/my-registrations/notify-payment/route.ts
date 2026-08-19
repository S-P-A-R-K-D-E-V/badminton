import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getBot } from '@/lib/bot'

const ACCOUNT_NO = '2510199966668'
const CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? ''

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const { paymentRequestId } = body ?? {}

  if (!paymentRequestId) {
    return NextResponse.json({ error: 'Thiếu mã yêu cầu thanh toán' }, { status: 400 })
  }

  const payReq = await prisma.paymentRequest.findUnique({ where: { id: paymentRequestId } })
  if (!payReq || payReq.status !== 'PENDING') {
    return NextResponse.json({ error: 'Yêu cầu thanh toán không hợp lệ' }, { status: 400 })
  }

  const registrations = await prisma.registration.findMany({
    where: { id: { in: payReq.registrationIds } },
    include: {
      court: { include: { session: { select: { title: true, date: true } } } },
    },
  })

  if (registrations.some((r) => r.status !== 'CONFIRMED' || r.isPaid)) {
    return NextResponse.json(
      { error: 'Một số đăng ký đã được thanh toán hoặc hủy, tra cứu lại để cập nhật' },
      { status: 400 }
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

  const bot = getBot()
  if (bot && CHAT_ID) {
    const text =
      `💰 <b>Thông báo thanh toán</b>\n\n` +
      `👤 <b>${payReq.name}</b> (${payReq.phone})\n` +
      `xin xác nhận đã chuyển khoản (mã: <b>${payReq.code}</b>):\n\n` +
      `${lines.join('\n')}\n\n` +
      `💵 Tổng: <b>${payReq.totalAmount.toLocaleString('vi-VN')}đ</b>\n` +
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

  return NextResponse.json({ id: payReq.id })
}
