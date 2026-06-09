import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { formatDate, formatTime } from '@/lib/utils'
import AdminSessionClient from '@/components/AdminSessionClient'

export const revalidate = 0

export default async function AdminSessionPage({ params }: { params: { id: string } }) {
  const session = await prisma.session.findUnique({
    where: { id: params.id },
    include: {
      cost: true,
      courts: {
        include: {
          registrations: {
            where: { status: { in: ['CONFIRMED', 'WAITLIST'] } },
            orderBy: [{ status: 'asc' }, { registeredAt: 'asc' }],
            select: {
              id: true,
              playerName: true,
              playerGender: true,
              playerRank: true,
              registrantName: true,
              registrantPhone: true,
              isProxy: true,
              status: true,
              isPaid: true,
              registeredAt: true,
            },
          },
          _count: { select: { registrations: { where: { status: 'CONFIRMED' } } } },
        },
      },
    },
  })

  if (!session) notFound()

  return (
    <div className=