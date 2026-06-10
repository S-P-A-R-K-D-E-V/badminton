import { prisma } from '@/lib/db';

import { AdminCalendarView } from 'src/sections/admin/calendar/view';

// ----------------------------------------------------------------------

export const revalidate = 0;

export const metadata = { title: 'Lịch buổi chơi | SPARK Badminton' };

const STATUS_COLOR: Record<string, string> = {
  OPEN: '#22C55E',
  CLOSED: '#919EAB',
  CANCELLED: '#FF5630',
};

// Giống canCancelRegistration trong lib/utils: ghép giờ local của cột Time vào cột Date
function combineDateTime(date: Date, time: Date) {
  const d = new Date(date);
  d.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return d;
}

export default async function AdminCalendarPage() {
  const sessions = await prisma.session.findMany({
    orderBy: { date: 'asc' },
    select: { id: true, title: true, date: true, startTime: true, endTime: true, status: true },
  });

  const events = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    start: combineDateTime(s.date, s.startTime).toISOString(),
    end: combineDateTime(s.date, s.endTime).toISOString(),
    color: STATUS_COLOR[s.status] ?? STATUS_COLOR.CLOSED,
  }));

  return <AdminCalendarView events={events} />;
}
