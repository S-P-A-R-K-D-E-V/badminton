import Container from '@mui/material/Container';

import { CancelView } from 'src/sections/cancel/view';

// ----------------------------------------------------------------------

export const metadata = { title: 'Hủy đăng ký | Quang Tâm Đức Badminton' };

export default function CancelPage({ params }: { params: { token: string } }) {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <CancelView token={params.token} />
    </Container>
  );
}
