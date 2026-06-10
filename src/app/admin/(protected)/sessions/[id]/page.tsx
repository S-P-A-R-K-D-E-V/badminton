import { notFound } from 'next/navigation';

import { prisma } from '@/lib/db';
import { formatDate, formatTime } from '@/lib/utils';

import { AdminSessionDetailView } from 'src/sections/admin/session-detail/view';

// ----------------------------------------------------------------------

export const revalidate = 0;

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
  });

  if (!session) notFound();

  const subtitle = `${formatDate(session.date)} · ${formatTime(session.startTime)} – ${formatTime(session.endTime)} · ${session.location}`;

  return (
    <AdminSessionDetailView
      session={JSON.parse(JSON.stringify(session))}
      title={session.title}
      subtitle={subtitle}
    />
  );
}
