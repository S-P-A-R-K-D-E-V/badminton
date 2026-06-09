import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getBot } from '@/lib/bot'

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('84') && digits.length === 11) return '0' + digits.slice(2)
  return digits
}

async function upsertTelegramUser(phone: string, chatId: string, firstName: string | null, username: string | null) {
  await prisma.telegramUser.upsert({
    where: { phone },
    create: { phone, chatId, firstName, username },
    update: { chatId, firstName, username },
  })
}

export async function POST(req: Request) {
  const secret = req.headers.get('x-telegram-bot-api-secret-token')
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const update = await req.json()
  const message = update?.message
  if (!message) return NextResponse.json({ ok: true })

  const chatId = String(message.chat.id)
  const text: string = message.text ?? ''
  const firstName = message.from?.first_name ?? null
  const username = message.from?.username ?? null

  const bot = getBot()
  if (!bot) return NextResponse.json({ ok: true })

  if (text.startsWith('/start')) {
    const parts = text.trim().split(' ')
    const phoneArg = parts[1]

    if (phoneArg) {
      const phone = normalizePhone(phoneArg)
      await upsertTelegramUser(phone, chatId, firstName, username)
      await bot.api.sendMessage(chatId,
        `Da lien ket Telegram voi so <b>${phone}</b>! Tu nay ban se nhan thong bao dang ky san. 🏸`,
        { parse_mode: 'HTML' }
      )
      return NextResponse.json({ ok: true })
    }

    await bot.api.sendMessage(chatId,
      `Xin chao${firstName ? ` <b>${firstName}</b>` : ''}! Hay gui <b>so dien thoai</b> cua ban (VD: <code>0901234567</code>) de nhan thong bao ca nhan.`,
      { parse_mode: 'HTML' }
    )
    return NextResponse.json({ ok: true })
  }

  if (/^(0|\+84|84)?[0-9]{9,10}$/.test(text.trim())) {
    const phone = normalizePhone(text.trim())
    await upsertTelegramUser(phone, chatId, firstName, username)
    await bot.api.sendMessage(chatId,
      `Da lien ket so <b>${phone}</b>! Ban se nhan thong bao khi dang ky san thanh cong va nhac nho truoc buoi choi.`,
      { parse_mode: 'HTML' }
    )
    return NextResponse.json({ ok: true })
  }

  await bot.api.sendMessage(chatId,
    `🏸 <b>SPARK Badminton Bot</b>\n\nGui so dien thoai de lien ket tai khoan va nhan thong bao ca nhan.`,
    { parse_mode: 'HTML' }
  )
  return NextResponse.json({ ok: true })
}
