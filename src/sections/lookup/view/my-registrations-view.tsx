'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Label } from 'src/components/label';
import { EmptyContent } from 'src/components/empty-content';

import { formatDate, formatTime, canCancelRegistration } from '@/lib/utils';

// ----------------------------------------------------------------------

type RegResult = {
  id: string;
  playerName: string;
  isProxy: boolean;
  cancelToken: string;
  registeredAt: string;
  courtName: string;
  session: {
    title: string;
    date: string;
    startTime: string;
    location: string;
    status: string;
  };
};

export function MyRegistrationsView() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [results, setResults] = useState<RegResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch(
        `/api/my-registrations?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}`
      );
      const data = await res.json();
      if (!res.ok) setError(data.error ?? 'Có lỗi xảy ra');
      else setResults(data);
    } catch {
      setError('Lỗi kết nối, thử lại sau');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Tra cứu đăng ký
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Nhập đúng tên và số điện thoại để xem danh sách đăng ký
          </Typography>
        </Box>

        <Card component="form" onSubmit={handleSearch} sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              required
              label="Tên người đăng ký"
              placeholder="Nguyễn Văn A"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              fullWidth
              required
              label="Số điện thoại"
              placeholder="0901234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <LoadingButton
              fullWidth
              type="submit"
              size="large"
              variant="contained"
              color="primary"
              loading={loading}
            >
              Tra cứu
            </LoadingButton>
          </Stack>
        </Card>

        {error && <Alert severity="error">{error}</Alert>}

        {results !== null &&
          (results.length === 0 ? (
            <EmptyContent title="Không tìm thấy đăng ký nào" sx={{ py: 6 }} />
          ) : (
            <Stack spacing={2}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {results.length} đăng ký
              </Typography>
              {results.map((r) => {
                const canCancel = canCancelRegistration(
                  new Date(r.session.date),
                  new Date(r.session.startTime)
                );
                const sessionClosed = r.session.status !== 'OPEN';
                return (
                  <Card key={r.id} sx={{ p: 2.5 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 1,
                        mb: 1.5,
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle1">{r.playerName}</Typography>
                        {r.isProxy && (
                          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                            Đăng ký hộ
                          </Typography>
                        )}
                      </Box>
                      {canCancel && !sessionClosed ? (
                        <Link
                          component={RouterLink}
                          href={paths.cancel(r.cancelToken)}
                          variant="caption"
                          sx={{ color: 'error.main', flexShrink: 0 }}
                        >
                          Hủy đăng ký
                        </Link>
                      ) : (
                        <Label variant="soft" color="default" sx={{ flexShrink: 0 }}>
                          {sessionClosed ? 'Đã đóng' : 'Hết hạn hủy'}
                        </Label>
                      )}
                    </Box>
                    <Stack spacing={0.25} sx={{ color: 'text.secondary', typography: 'body2' }}>
                      <span>📋 {r.session.title}</span>
                      <span>
                        📅 {formatDate(r.session.date)} · {formatTime(r.session.startTime)}
                      </span>
                      <span>
                        🏸 Sân {r.courtName} · 📍 {r.session.location}
                      </span>
                    </Stack>
                  </Card>
                );
              })}
            </Stack>
          ))}
      </Stack>
    </Container>
  );
}
