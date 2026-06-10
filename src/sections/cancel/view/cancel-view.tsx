'use client';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { LoadingScreen } from 'src/components/loading-screen';

import { formatDate } from '@/lib/utils';

// ----------------------------------------------------------------------

type CancelInfo = {
  playerName: string;
  courtName: string;
  sessionTitle: string;
  sessionDate: string;
  canCancel: boolean;
};

type Props = {
  token: string;
};

export function CancelView({ token }: Props) {
  const [info, setInfo] = useState<CancelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/cancel/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setInfo(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Lỗi kết nối');
        setLoading(false);
      });
  }, [token]);

  async function handleCancel() {
    setSubmitting(true);
    const res = await fetch(`/api/cancel/${token}`, { method: 'DELETE' });
    const json = await res.json();
    if (res.ok) setCancelled(true);
    else setError(json.error);
    setSubmitting(false);
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (cancelled) {
    return (
      <Card sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h2" component="div" sx={{ mb: 1 }}>
          ✅
        </Typography>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Đã hủy đăng ký
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Chỗ của bạn đã được giải phóng
        </Typography>
        <Button fullWidth variant="contained" color="primary" component={RouterLink} href={paths.home}>
          Về trang chủ
        </Button>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h2" component="div" sx={{ mb: 1 }}>
          ❌
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          {error}
        </Typography>
        <Button component={RouterLink} href={paths.home}>
          Về trang chủ
        </Button>
      </Card>
    );
  }

  if (!info) return null;

  return (
    <Card sx={{ p: 3 }}>
      <Stack spacing={2.5}>
        <Typography variant="h5">Hủy đăng ký</Typography>

        <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: 'background.neutral' }}>
          <Stack spacing={0.5} sx={{ typography: 'body2' }}>
            <span>
              <Box component="span" sx={{ color: 'text.secondary' }}>
                Người chơi:
              </Box>{' '}
              <strong>{info.playerName}</strong>
            </span>
            <span>
              <Box component="span" sx={{ color: 'text.secondary' }}>
                Buổi chơi:
              </Box>{' '}
              {info.sessionTitle}
            </span>
            <span>
              <Box component="span" sx={{ color: 'text.secondary' }}>
                Ngày:
              </Box>{' '}
              {formatDate(info.sessionDate)}
            </span>
            <span>
              <Box component="span" sx={{ color: 'text.secondary' }}>
                Sân:
              </Box>{' '}
              {info.courtName}
            </span>
          </Stack>
        </Box>

        {!info.canCancel ? (
          <Alert severity="error">Đã quá hạn hủy (chỉ được hủy trước 2 tiếng)</Alert>
        ) : (
          <LoadingButton
            fullWidth
            size="large"
            variant="contained"
            color="error"
            loading={submitting}
            onClick={handleCancel}
          >
            Xác nhận hủy đăng ký
          </LoadingButton>
        )}

        <Button component={RouterLink} href={paths.home} sx={{ color: 'text.secondary' }}>
          Quay lại
        </Button>
      </Stack>
    </Card>
  );
}
