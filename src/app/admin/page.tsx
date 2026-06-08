import { prisma } from '@/lib/db'
import { formatDate, formatTime } from '@/lib/utils'
import Link from 'next/link'
import CreateSessionButton from '@/components/CreateSessionButton'

export const revalidate = 0

async function getSessions() {
  return prisma.session.findMany({
    include: {
      courts: {
        include: {
          _count: { select: { registrations: { where: { status: 'CONFIRMED' } } } },
        },
      },
    },
    orderBy: [{ date: 'desc' }],
    take: 20,
  })
}

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Đang mở',
  CLOSED: 'Đã đóng',
  CANCELLED: 'Đã hủy',
}

const STATUS_COLOR: Record<string, string> = {
  OPEN: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-600',
}

export default async function AdminPage() {
  const sessions = await getSessions()

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Quản lý buổi chơi</h1>
        <CreateSessionButton />
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Chưa có buổi chơi nào</div>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((s) => {
            const totalBooked = s.courts.reduce((sum, c) => sum + c._count.registrations, 0)
            const totalSlots = s.courts.reduce((sum, c) => sum + c.maxSlots, 0)
            return (
              <Link
                key={s.id}
                href={`/admin/sessions/${s.id}`}
                className="bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h2 className="font-semibold text-gray-900">{s.title}</h2>
                    <p className="text-sm text-gray-500">{formatDate(s.date)} · {formatTime(s.startTime)}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[s.status]}`}>
                    {STATUS_LABEL[s.status]}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span>📍 {s.location}</span>
                  <span>👥 {totalBooked}/{totalSlots}</span>
                  <span>{s.courts.length} sân</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
