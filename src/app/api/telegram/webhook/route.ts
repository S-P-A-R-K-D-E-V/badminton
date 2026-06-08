import { NextResponse } from 'next/server'
import { getBot } from '@/lib/bot'
import { prisma } from '@/lib/db'
import { formatTime } from '@/lib/utils'

// Set up bot commands on first request
let initialized = false

function initBot() {
  const bot = getBot()
  if (!bot || initialized) return
  initialized = true

  bot.command('start', (ctx) =>
    ctx.reply('🏸 Chào mừng đến SPARK Badminton!\nDùng /upcoming để xem lịch chơi sắp tới.')
  )

  bot.command('upcoming', async (ctx) => {
    const sessions = await prisma.session.findMany({
      where: { date: { gte: new Date() }, status: { not: 'CANCELLED' } },
      include: {
        courts: {
          include: {
            _count: { select: { registrations: { where: { status: 'CONFIRMED' } } } },
          },
        },
      },
      orderBy: { date: 'asc' },
      take: 5,
    })

    if (sessions.length === 0) {
      return ctx.reply('Hiện chưa có buổi chơi nào sắp tới.')
    }

    const lines = sessions.map((s) => {
      const totalSlots = s.courts.reduce((sum, c) => sum + c.maxSlots, 0)
      const totalBooked = s.courts.reduce((sum, c) => sum + c._count.registrations, 0)
      return (
        `📅 <b>${s.title}</b>\n` +
        `🕐 ${formatTime(s.startTime)} | 📍 ${s.location}\n` +
        `👥 ${totalBooked}/${totalSlots} người\n` +
        `🔗 ${process.env.NEXT_PUBLIC_BASE_URL}/session/${s.id}`
      )
    })

    await ctx.reply(lines.join('\n\n'), { parse_mode: 'HTML' })
  })
}

export async function POST(req: Request) {
  const bot = getBot()
  if (!bot) return NextResponse.json({ error: 'Bot not configured' }, { status: 503 })

  initBot()

  const update = await req.json()
  await bot.handleUpdate(update)
  return NextResponse.json({ ok: true })
}
