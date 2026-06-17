import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getBot } from '@/lib/bot'

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('84') && digits.length === 11) return '0' + digits.slice(2)
  return digits
}

async function upsertTelegramUser(
  phone: string,
  chatId: string,
  firstName: string | null,
  username: string | null
) {
  await prisma.telegramUser.upsert({
    where: { phone },
    create: { phone, chatId, firstName, username },
    update: { chatId, firstName, username },
  })
}

async function handleCallbackQuery(cbq: {
  id: string
  data?: string
  message?: { chat?: { id?: number }; message_id?: number }
}) {
  const bot = getBot()
  if (!bot) return

  const cbqId = cbq.id
  const data = cbq.data ?? ''
  const chatId = cbq.message?.chat?.id
  const msgId = cbq.message?.message_id ?? 0

  if (!data.startsWith('pay_confirm:') && !data.startsWith('pay_cancel:')) {
    await bot.api.answerCallbackQuery(cbqId, {})
    return
  }

  const colonIdx = data.indexOf(':')
  const action = data.slice(0, colonIdx)
  const reqId = data.slice(colonIdx + 1)

  const payReq = await prisma.paymentRequest.findUnique({ where: { id: reqId } })

  if (!payReq || payReq.status !== 'PENDING') {
    await bot.api.answerCallbackQuery(cbqId, {
      text: 'Yêu cầu không tồn tại hoặc đã được xử lý rồi.',
    })
    return
  }

  if (action === 'pay_confirm') {
    await prisma.registration.updateMany({
      where: { id: { in: payReq.registrationIds } },
      data: { isPaid: true, paidAt: new Date() },
    })
    await prisma.paymentRequest.update({
      where: { id: reqId },
      data: { status: 'CONFIRMED', resolvedAt: new Date() },
    })

    if (chatId && msgId) {
      await bot.api.editMessageText(
        chatId,
        msgId,
        `✅ <b>Đã xác nhận thanh toán</b>\n\n` +
          `👤 <b>${payReq.name}</b> (${payReq.phone})\n` +
          `💵 Tổng: <b>${payReq.totalAmount.toLocaleString('vi-VN')}đ</b>\n\n` +
          `<i>Đã đánh dấu đã trả.</i>`,
        { parse_mode: 'HTML' }
      )
    }

    await bot.api.answerCallbackQuery(cbqId, { text: '✅ Đã xác nhận!' })
  } else {
    await prisma.paymentRequest.update({
      where: { id: reqId },
      data: { status: 'REJECTED', resolvedAt: new Date() },
    })

    if (chatId && msgId) {
      await bot.api.editMessageText(
        chatId,
        msgId,
        `❌ <b>Đã hủy xác nhận</b>\n\n` +
          `👤 <b>${payReq.name}</b> (${payReq.phone})\n` +
          `💵 Tổng: <b>${payReq.totalAmount.toLocaleString('vi-VN')}đ</b>\n\n` +
          `<i>Chưa được xác nhận đã trả.</i>`,
        { parse_mode: 'HTML' }
      )
    }

    await bot.api.answerCallbackQuery(cbqId, { text: '❌ Đã hủy' })
  }
}

// ----------------------------------------------------------------------

export async function POST(req: Request) {
  const secret = req.headers.get('x-telegram-bot-api-secret-token')
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const update = await req.json()

  // ── callback_query (inline keyboard button press) ─────────────────────
  if (update?.callback_query) {
    try {
      await handleCallbackQuery(update.callback_query)
    } catch (err) {
      // Log but always return 200 — Telegram retries on non-200, which could cause loops
      console.error('[webhook] callback_query error:', err)
    }
    return NextResponse.json({ ok: true })
  }

  // ── Regular message ───────────────────────────────────────────────────
  const message = update?.message
  if (!message) return NextResponse.json({ ok: true })

  const bot = getBot()
  if (!bot) return NextResponse.json({ ok: true })

  const chatId = String(message.chat.id)
  const text: string = message.text ?? ''
  const firstName = message.from?.first_name ?? null
  const username = message.from?.username ?? null

  try {
    if (text.startsWith('/start')) {
      const parts = text.trim().split(' ')
      const phoneArg = parts[1]

      if (phoneArg) {
        const phone = normalizePhone(phoneArg)
        await upsertTelegramUser(phone, chatId, firstName, username)
        await bot.api.sendMessage(
          chatId,
          `Da lien ket Telegram voi so <b>${phone}</b>! Tu nay ban se nhan thong bao dang ky san. 🏸`,
          { parse_mode: 'HTML' }
        )
        return NextResponse.json({ ok: true })
      }

      await bot.api.sendMessage(
        chatId,
        `Xin chao${firstName ? ` <b>${firstName}</b>` : ''}! Hay gui <b>so dien thoai</b> cua ban (VD: <code>0901234567</code>) de nhan thong bao ca nhan.`,
        { parse_mode: 'HTML' }
      )
      return NextResponse.json({ ok: true })
    }

    if (/^(0|\+84|84)?[0-9]{9,10}$/.test(text.trim())) {
      const phone = normalizePhone(text.trim())
      await upsertTelegramUser(phone, chatId, firstName, username)
      await bot.api.sendMessage(
        chatId,
        `Da lien ket so <b>${phone}</b>! Ban se nhan thong bao khi dang ky san thanh cong va nhac nho truoc buoi choi.`,
        { parse_mode: 'HTML' }
      )
      return NextResponse.json({ ok: true })
    }

    await bot.api.sendMessage(
      chatId,
      `🏸 <b>Quang Tâm Đức Badminton Bot</b>\n\nGui so dien thoai de lien ket tai khoan va nhan thong bao ca nhan.`,
      { parse_mode: 'HTML' }
    )
  } catch (err) {
    console.error('[webhook] message handler error:', err)
  }

  return NextResponse.json({ ok: true })
}
