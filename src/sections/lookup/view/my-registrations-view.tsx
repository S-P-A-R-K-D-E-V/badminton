'use client';

import { useState, useCallback } from 'react';
import { isSameDay } from 'date-fns';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

import { formatDate, formatTime, canCancelRegistration } from '@/lib/utils';

import { RegistrationCalendar } from '../registration-calendar';
import { PaymentDialog } from '../payment-dialog';

// ----------------------------------------------------------------------

type RegResult = {
  id: string;
  playerName: string;
  isProxy: boolean;
  cancelToken: string;
  registeredAt: string;
  courtName: string;
  isPaid: boolean;
  costPerPerson: number;
  hasCost: boolean;
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [paymentOpen, setPaymentOpen] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    setSelectedDate(null);
    setSelected(new Set());
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

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const filteredResults =
    results && selectedDate
      ? results.filter((r) => isSameDay(new Date(r.session.date), selectedDate))
      : results;

  // Registrations eligible for payment selection (hasCost + not yet paid)
  const selectableIds = new Set(results?.filter((r) => r.hasCost && !r.isPaid).map((r) => r.id) ?? []);

  const selectedRegs = results?.filter((r) => selected.has(r.id)) ?? [];

  const totalSelected = selectedRegs.reduce((sum, r) => sum + r.costPerPerson, 0);

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
            <Stack spacing={2.5}>
              {/* Calendar widget */}
              <RegistrationCalendar
                registrations={results}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />

              {/* Result count + active filter chip */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {selectedDate
                    ? `${filteredResults?.length ?? 0} / ${results.length} đăng ký`
                    : `${results.length} đăng ký`}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  {/* Select-all for eligible items in current view */}
                  {selectableIds.size > 0 && (
                    <Chip
                      label={
                        Array.from(selectableIds).every((id) => selected.has(id))
                          ? 'Bỏ chọn tất cả'
                          : 'Chọn tất cả chưa trả'
                      }
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        const ids = Array.from(selectableIds);
                        const allSelected = ids.every((id) => selected.has(id));
                        setSelected(allSelected ? new Set() : new Set(ids));
                      }}
                      sx={{ height: 24 }}
                    />
                  )}
                  {selectedDate && (
                    <Chip
                      label="Xóa bộ lọc"
                      size="small"
                      onDelete={() => setSelectedDate(null)}
                      onClick={() => setSelectedDate(null)}
                      sx={{ height: 24 }}
                    />
                  )}
                </Box>
              </Box>

              {/* Registration cards */}
              {filteredResults?.length === 0 ? (
                <EmptyContent title="Không có đăng ký trong ngày này" sx={{ py: 4 }} />
              ) : (
                <Stack spacing={2} sx={{ pb: selected.size > 0 ? 10 : 0 }}>
                  {filteredResults?.map((r) => {
                    const canCancel = canCancelRegistration(
                      new Date(r.session.date),
                      new Date(r.session.startTime)
                    );
                    const sessionClosed = r.session.status !== 'OPEN';
                    const isSelectable = r.hasCost && !r.isPaid;
                    const isChecked = selected.has(r.id);

                    return (
                      <Card
                        key={r.id}
                        sx={{
                          p: 2.5,
                          outline: isChecked ? '2px solid' : 'none',
                          outlineColor: 'primary.main',
                          transition: 'outline 0.15s',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                          {/* Checkbox for unpaid + cost-set registrations */}
                          {isSelectable && (
                            <Checkbox
                              size="small"
                              checked={isChecked}
                              onChange={() => toggleSelect(r.id)}
                              sx={{ mt: 0.25, ml: -1, p: 0.75 }}
                            />
                          )}

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            {/* Header: name + action */}
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
                                <Label
                                  variant="soft"
                                  color="default"
                                  sx={{ flexShrink: 0 }}
                                >
                                  {sessionClosed ? 'Đã đóng' : 'Hết hạn hủy'}
                                </Label>
                              )}
                            </Box>

                            {/* Session info */}
                            <Stack
                              spacing={0.25}
                              sx={{ color: 'text.secondary', typography: 'body2' }}
                            >
                              <span>📋 {r.session.title}</span>
                              <span>
                                📅 {formatDate(r.session.date)} · {formatTime(r.session.startTime)}
                              </span>
                              <span>
                                🏸 Sân {r.courtName} · 📍 {r.session.location}
                              </span>
                            </Stack>

                            {/* Cost + payment status */}
                            {r.costPerPerson > 0 && (
                              <Box
                                sx={{
                                  mt: 1.25,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  flexWrap: 'wrap',
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    typography: 'caption',
                                    color: 'text.secondary',
                                  }}
                                >
                                  <Iconify icon="solar:money-bag-linear" width={14} />
                                  Chi phí:{' '}
                                  <b style={{ color: 'inherit' }}>
                                    {r.costPerPerson.toLocaleString('vi-VN')}đ
                                  </b>
                                </Box>
                                <Label
                                  variant="soft"
                                  color={r.isPaid ? 'success' : 'warning'}
                                  sx={{ height: 20, fontSize: 10 }}
                                >
                                  {r.isPaid ? '✓ Đã trả' : 'Chưa trả'}
                                </Label>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Card>
                    );
                  })}
                </Stack>
              )}
            </Stack>
          ))}
      </Stack>

      {/* ── Sticky payment bar (appears when items selected) ── */}
      {selected.size > 0 && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: { xs: 72, md: 16 },
            left: '50%',
            transform: 'translateX(-50%)',
            width: { xs: 'calc(100% - 32px)', sm: 480 },
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            borderRadius: 2,
            zIndex: (theme) => theme.zIndex.snackbar,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2">{selected.size} đăng ký</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Tổng: {totalSelected.toLocaleString('vi-VN')}đ
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            <Button
              size="small"
              color="inherit"
              onClick={() => setSelected(new Set())}
            >
              Bỏ chọn
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<Iconify icon="solar:wallet-money-bold" width={16} />}
              onClick={() => setPaymentOpen(true)}
            >
              Thông báo TT
            </Button>
          </Box>
        </Paper>
      )}

      {/* ── Payment dialog ── */}
      <PaymentDialog
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        selectedRegs={selectedRegs}
        name={name}
        phone={phone}
        onSuccess={() => setSelected(new Set())}
      />
    </Container>
  );
}
