import { prisma } from '@/lib/db';

import { SessionListView } from 'src/sections/admin/sessions/view';

// ----------------------------------------------------------------------

export const revalidate = 0;

export const metadata = { title: 'Quản lý buổi chơi | SPARK Badminton' };

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
  });
}

export default async function AdminSessionsPage() {
  const sessions = await getSessions();

  return <SessionListView sessions={JSON.parse(JSON.stringify(sessions))} />;
}
