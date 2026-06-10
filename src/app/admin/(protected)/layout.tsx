import { redirect } from 'next/navigation';

import { getAdmin } from '@/lib/auth';

import { DashboardLayout } from 'src/layouts/dashboard';

// ----------------------------------------------------------------------

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) redirect('/admin/login');

  return <DashboardLayout>{children}</DashboardLayout>;
}
