import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Label } from 'src/components/label';

import type { RegistrationResult } from './types';

// ----------------------------------------------------------------------

type Props = {
  results: RegistrationResult[];
  waitlistCount: number;
};

export function RegistrationSuccess({ results, waitlistCount }: Props) {
  const allWaitlisted = waitlistCount > 0 && results.every((r) => r.status === 'WAITLIST');

  return (
    <Card sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h2" component="div" sx={{ mb: 1 }}>
        {allWaitlisted ? '⏳' : '✅'}
      </Typography>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {allWaitlisted ? 'Đã vào hàng chờ!' : 'Đăng ký thành công!'}
      </Typography>

      {waitlistCount > 0 && (
        <Alert severity="warning" sx={{ mb: 3, textAlign: 'left' }}>
          Sân đầy — {waitlistCount} người đang trong hàng chờ. Bạn sẽ được confirm tự động khi có
          người hủy.
        </Alert>
      )}

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Lưu link hủy phòng khi cần (trước 2h)
      </Typography>

      <Stack spacing={1.5} sx={{ mb: 3, textAlign: 'left' }}>
        {results.map((r) => (
          <Box
            key={r.cancelToken}
            sx={(theme) => ({
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: 'background.neutral',
              ...(r.status === 'WAITLIST' && {
                bgcolor: 'warning.lighter',
                ...theme.applyStyles('dark', { bgcolor: 'warning.darker' }),
              }),
            })}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="subtitle2">{r.playerName}</Typography>
              {r.status === 'WAITLIST' && (
                <Label color="warning" variant="soft">
                  Hàng chờ
                </Label>
              )}
            </Box>
            <Typography
              component={RouterLink}
              href={paths.cancel(r.cancelToken)}
              variant="caption"
              sx={{ color: 'error.main', wordBreak: 'break-all' }}
            >
              🔗 Link hủy đăng ký
            </Typography>
          </Box>
        ))}
      </Stack>

      <Stack spacing={1}>
        <Button fullWidth variant="contained" color="primary" component={RouterLink} href={paths.home}>
          Về trang chủ
        </Button>
        <Button fullWidth variant="outlined" component={RouterLink} href={paths.myRegistrations}>
          Tra cứu đăng ký của tôi
        </Button>
      </Stack>
    </Card>
  );
}
