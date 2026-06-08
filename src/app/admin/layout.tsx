import { getAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin()
  if (!admin) redirect('/admin/login')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="font-bold text-gray-900 hover:text-green-600">
            ⚙️ Admin
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-500">{admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            Xem trang chủ
          </Link>
          <LogoutButton />
        </div>
      </div>
      {children}
    </div>
  )
}
