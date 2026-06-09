import { Bot } from 'grammy'
import { formatTime } from './utils'

let bot: Bot | null = null

export function getBot(): Bot | null {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return null
  if (!bot) bot = new Bot(token)
  return bot
}

const CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? ''

async function sendMessage(text: string) {
  const b = getBot()
  if (!b || !CHAT_ID) return
  await b.api.sendMessage(CHAT_ID, text, { parse_mode: 'HTML' })
}

export async function notifyCourtStatus(
  court: { name: string; maxSlots: number; warnAt: number },
  currentCount: number
) {
  if (currentCount >= court.maxSlots) {
    await sendMessage(
      `🔴 <b>Sân ${court.name} đã đầy</b> (${currentCount}/${court.maxSlots} người)\nĐăng ký đã bị khóa.`
    )
  } else if (currentCount >= court.warnAt) {
    await sendMessage(
      `🟡 <b>Sân ${court.name} sắp đầy</b> (${currentCount}/${court.maxSlots} người)\nCòn ${court.maxSlots - currentCount} chỗ trống.`
    )
  }
}

export async function sendPersonalCancelLink(
  chatId: string,
  registrations: { playerName: string; cancelToken: string; status: string }[],
  sessionTitle: string,
  courtName: string
) {
  const b = getBot()
  if (!b) return

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://badminton.cici21chualang.vn'

  const lines = registrations.map((r) => {
    const statusBadge = r.status === 'WAITLIST' ? ' <i>(Hàng chờ)</i>' : ''
    return `• <b>${r.playerName}</b>${statusBadge}\n  🔗 <a href="${appUrl}/cancel/${r.cancelToken}">Hủy đăng ký</a>`
  })

  await b.api.sendMessage(
    chatId,
    `✅ <b>Đăng ký thành công!</b>\n\n📋 ${sessionTitle}\n🏸 Sân ${courtName}\n\n${lines.join('\n\n')}\n\n<i>Lưu link hủy nếu cần hủy trước buổi chơi.</i>`,
    { parse_mode: 'HTML', link_preview_options: { is_disabled: true } }
  )
}

export async function notifyWaitlistPromoted(playerName: string, courtName: string, sessionTitle: string) {
  await sendMessage(
    `✅ <b>${playerName}</b> đã được vào sân!\n\n` +
    `📋 ${sessionTitle}\n` +
    `🏸 Sân ${courtName}\n\n` +
    `Có người hủy nên bạn đã được chuyển từ hàng chờ sang confirmed.`
  )
}

export async function sendReminders() {
  const { prisma } = await import('./db')
  const { subHours, addHours, isWithinInterval } = await import('date-fns')

  const now = new Date()
  const windowEnd = addHours(now, 2.25) // check sessions starting in ~2h

  const sessions = await prisma.session.findMany({
    where: {
      status: 'OPEN',
      date: {
        gte: new Date(now.toDateString()),
        lte: new Date(windowEnd.toDateString()),
      },
    },
    include: {
      courts: {
        include: {
          registrations: {
            where: { status: 'CONFIRMED', notified: false },
            select: { id: true, playerName: true, registrantName: true, registr