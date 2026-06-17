import { getAdminStats } from '@/lib/admin-stats';

import { OverviewView } from 'src/sections/admin/overview/view';

// ----------------------------------------------------------------------

export const revalidate = 0;

export const metadata = { title: 'Tổng quan | Quang Tâm Đức Badminton' };

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

  return <OverviewView stats={stats} />;
}
