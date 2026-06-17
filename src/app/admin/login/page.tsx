import { AuthCenteredLayout } from 'src/layouts/auth-centered';

import { AdminPinView } from 'src/sections/auth/admin-pin-view';

// ----------------------------------------------------------------------

export const metadata = { title: 'Đăng nhập Admin | Quang Tâm Đức Badminton' };

export default function AdminLoginPage() {
  return (
    <AuthCenteredLayout>
      <AdminPinView />
    </AuthCenteredLayout>
  );
}
