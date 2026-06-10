import { prisma } from '@/lib/db';

import { HomeView } from 'src/sections/home/view';

// ----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

async function getSessions(past = false) {
  const today = new Date(new Date().toDateString());
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
  });
}

export default async function HomePage({ searchParams }: { searchParams: { tab?: string } }) {
  const isPast = searchParams.tab === 'past';
  const sessions = await getSessions(isPast);

  return <HomeView sessions={sessions} isPast={isPast} />;
}
