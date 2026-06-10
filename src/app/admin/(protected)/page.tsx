import { redirect } from 'next/navigation';

// ----------------------------------------------------------------------

// Tạm thời chuyển hướng sang danh sách buổi chơi; Phase 5 thay bằng dashboard tổng quan.
export default function AdminPage() {
  redirect('/admin/sessions');
}
