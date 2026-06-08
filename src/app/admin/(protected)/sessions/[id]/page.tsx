import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { formatDate, formatTime } from '@/lib/utils'
import AdminSessionClient from '@/components/AdminSessionClient'

export const revalidate = 0

export default async function AdminSessionPage({ params }: { params: { id: string } }) {
  const session = await prisma.session.findUnique({
    where: { id: params.id },
    include: {
      courts: {
        include: {
          registrations: {
            where: { status: 'CONFIRMED' },
            orderBy: { registeredAt: 'asc' },
          },
          _count: { select: { registrations: { where: { status: 'CONFIRMED' } } } },
        },
      },
    },
  })

  if (!session) notFound()

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{session.title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {formatDate(session.date)} · {formatTime(session.startTime)} – {formatTime(session.endTime)} · {session.location}
        </p>
      </div>

      <AdminSessionClient session={JSON.parse(JSON.stringify(session))} />
    </div>
  )
}
