import { prisma } from '@/lib/db'
import { formatDate, formatTime } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getSessions(past = false) {
  const today = new Date(new Date().toDateString())
  return prisma.session.findMany({
    where: past
      ? { date: { lt: today } }
      : { date: { gte: today }, status: { not: 'CANCELLED' } },
    include: {
      courts: {
        include: {
          _count: {
            select: { registrations: { where: { status: 'CONFIRMED' } } },
          },
        },
      },
    },
    orderBy: [{ date: past ? 'desc' : 'asc' }, { startTime: 'asc' }],
    take: past ? 10 : undefined,
  })
}

function SessionCard({ session }: { session: Awaited<ReturnType<typeof getSessions>>[0] }) {
  const totalSlots = session.courts.reduce((s, c) => s + c.maxSlots, 0)
  const totalBooked = session.courts.reduce((s, c) => s + c._count.registrations, 0)
  const isFull = totalBooked >= totalSlots
  const isWarn = totalBooked >= totalSlots * 0.8

  return (
    <Link
      href={`/session/${session.id}`}
      className="bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-gray-900">{session.title}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{formatDate(session.date)}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${
          session.status === 'CANCELLED' ? 'bg-gray-100 text-gray-500'
            : isFull ? 'bg-red-100 text-red-700'
            : isWarn ? 'bg-yellow-100 text-yellow-700'
            : 'bg-green-100 text-green-700'
        }`}>
          {session.status === 'CANCELLED' ? 'Đã hủy' : isFull ? 'Đã đầy' : isWarn ? 'Sắp đầy' : 'Còn chỗ'}
        </span>
      </div>
      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
        <span>🕐 {formatTime(session.startTime)} – {formatTime(session.endTime)}</span>
        <span>📍 {session.location}</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {session.courts.map((court) => {
          const booked = court._count.registrations
          const full = booked >= court.maxSlots
          const warn = booked >= court.warnAt
          return (
            <div key={court.id} className={`text-xs px-2 py-1 rounded-full border font-medium ${
              full ? 'border-red-200 bg-red-50 text-red-700'
                : warn ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
                : 'border-gray-200 bg-gray-50 text-gray-600'
            }`}>
              {court.name}: {booked}/{court.maxSlots}
            </div>
          )
        })}
      </div>
    </Link>
  )
}

export default async function HomePage({ searchParams }: { searchParams: { tab?: string } }) {
  const isPast = searchParams.tab === 'past'
  const sessions = await getSessions(isPast)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Lịch chơi</h1>
        <Link href="/my-registrations" className="text-sm text-green-600 hover:underline">
          Tra cứu đăng ký
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
        <Link
          href="/"
          className={`flex-1 text-center text-sm font-medium py-1.5 rounded-md transition-colors ${
            !isPast ? 'bg-