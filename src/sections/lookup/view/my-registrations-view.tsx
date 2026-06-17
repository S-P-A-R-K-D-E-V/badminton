'use client';

import { useState, useMemo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
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

import { PaymentDialog } from '../payment-dialog';

// ----------------------------------------------------------------------

type RegResult = {
  id: string;
  sessionId: string;
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

type SessionGroup = {
  sessionId: string;
  session: RegResult['session'];
  registrations: RegResult[];
  hasCost: boolean;
  costPerPerson: number;
  unpaidRegs: RegResult[];
  paidRegs: RegResult[];
};

function groupBySessions(results: RegResult[]): SessionGroup[] {
  const map = new Map<string, { session: RegResult['session']; regs: RegResult[] }>();
  for (const r of results) {
    if (!map.has(r.sessionId)) map.set(r.sessionId, { session: r.session, regs: [] });
    map.get(r.sessionId)!.regs.push(r);
  }
  return Array.from(map.values())
    .map(({ session, regs }) => {
      const hasCost = regs[0]?.hasCost ?? false;
      const costPerPerson = regs[0]?.costPerPerson ?? 0;
      return {
        sessionId: regs[0].sessionId,
        session,
        registrations: regs,
        hasCost,
        costPerPerson,
        unpaidRegs: hasCost ? regs.filter((r) => !r.isPaid) : [],
        paidRegs: regs.filter((r) => r.isPaid),
      };
    })
    .sort((a, b) => new Date(b.session.date).getTime() - new Date(a.session.date).getTime());
}

// ----------------------------------------------------------------------

export function MyRegistrationsView() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [results, setResults] = useState<RegResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedRegIds, setSelectedRegIds] = useState<Set<string>>(new Set());
  const [paymentOpen, setPaymentOpen] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    setExpanded(new Set());
    setSelectedRegIds(new Set());
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

  const groups = useMemo(() => (results ? groupBySessions(results) : []), [results]);

  const toggleExpand = useCallback((sid: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
  }, []);

  // Toggle a single registration's selection
  const toggleSelectReg = useCallback((rid: string) => {
    setSelectedRegIds((prev) => {
      const next = new Set(prev);
      if (next.has(rid)) next.delete(rid);
      else next.add(rid);
      return next;
    });
  }, []);

  // Toggle the whole session: select all unpaid regs, or clear them if all already selected
  const toggleSelectSession = useCallback((unpaidRegs: RegResult[]) => {
    setSelectedRegIds((prev) => {
      const next = new Set(prev);
      const allSelected = unpaidRegs.every((r) => next.has(r.id));
      if (allSelected) unpaidRegs.forEach((r) => next.delete(r.id));
      else unpaidRegs.forEach((r) => next.add(r.id));
      return next;
    });
  }, []);

  const selectedRegs = useMemo(
    () => groups.flatMap((g) => g.unpaidRegs).filter((r) => selectedRegIds.has(r.id)),
    [groups, selectedRegIds]
  );
  const selectedSessionCount = useMemo(
    () => new Set(selectedRegs.map((r) => r.sessionId)).size,
    [selectedRegs]
  );
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

        {/* Search form */}
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
              loading={loading}
            >
              Tra cứu
            </LoadingButton>
          </Stack>
        </Card>

        {error && <Alert severity="error">{error}</Alert>}

        {/* Results */}
        {results !== null && (
          groups.length === 0 ? (
            <EmptyContent title="Không tìm thấy đăng ký nào" sx={{ py: 6 }} />
          ) : (
            <Stack spacing={1.5} sx={{ pb: selectedRegIds.size > 0 ? 10 : 0 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {groups.length} buổi · {results.length} đăng ký
              </Typography>

              {groups.map((group) => {
                const isExpanded = expanded.has(group.sessionId);
                const canSelect = group.hasCost && group.unpaidRegs.length > 0;
                const selectedCount = group.unpaidRegs.filter((r) =>
                  selectedRegIds.has(r.id)
                ).length;
                const allSelected = selectedCount > 0 && selectedCount === group.unpaidRegs.length;
                const someSelected = selectedCount > 0 && !allSelected;

                return (
                  <Card
                    key={group.sessionId}
                    sx={{
                      outline: selectedCount > 0 ? '2px solid' : 'none',
                      outlineColor: 'primary.main',
                      transition: 'outline 0.15s',
                    }}
                  >
                    {/* ── Clickable header ── */}
                    <Box
                      onClick={() => toggleExpand(group.sessionId)}
                      sx={{
                        p: 2.5,
                        cursor: 'pointer',
                        userSelect: 'none',
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                        {/* Checkbox — stops click from propagating to header */}
                        {canSelect ? (
                          <Checkbox
                            size="small"
                            checked={allSelected}
                            indeterminate={someSelected}
                            onChange={() => toggleSelectSession(group.unpaidRegs)}
                            onClick={(e) => e.stopPropagation()}
                            sx={{ mt: 0.25, ml: -0.75, p: 0.75, flexShrink: 0 }}
                          />
                        ) : (
                          <Box sx={{ width: 34, flexShrink: 0 }} />
                        )}

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          {/* Title + expand icon */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: 1,
                            }}
                          >
                            <Typography variant="subtitle1" sx={{ lineHeight: 1.4 }}>
                              {group.session.title}
                            </Typography>
                            <Iconify
                              icon={
                                isExpanded
                                  ? 'eva:chevron-up-fill'
                                  : 'eva:chevron-down-fill'
                              }
                              width={20}
                              sx={{ flexShrink: 0, mt: 0.25, color: 'text.disabled' }}
                            />
                          </Box>

                          {/* Date + location */}
                          <Stack
                            spacing={0.25}
                            sx={{ mt: 0.5, typography: 'body2', color: 'text.secondary' }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Iconify icon="solar:calendar-outline" width={13} />
                              {formatDate(group.session.date)} · {formatTime(group.session.startTime)}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Iconify icon="mingcute:location-line" width={13} />
                              {group.session.location}
                            </Box>
                          </Stack>

                          {/* Summary: count + cost + status labels */}
                          <Box
                            sx={{
                              mt: 1.25,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              flexWrap: 'wrap',
                            }}
                          >
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              👥 {group.registrations.length} người đăng ký
                            </Typography>

                            {group.hasCost && (
                              <>
                                <Typography
                                  variant="caption"
                                  sx={{ color: 'text.disabled' }}
                                >
                                  ·
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  💰 {group.costPerPerson.toLocaleString('vi-VN')}đ/người
                                </Typography>
                              </>
                            )}
                          </Box>

                          {/* Payment status badges */}
                          {group.hasCost &&
                            (group.paidRegs.length > 0 || group.unpaidRegs.length > 0) && (
                              <Box sx={{ mt: 0.75, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                                {group.paidRegs.length > 0 && (
                                  <Label
                                    variant="soft"
                                    color="success"
                                    sx={{ height: 20, fontSize: 10 }}
                                  >
                                    ✓ Đã trả ×{group.paidRegs.length}
                                  </Label>
                                )}
                                {group.unpaidRegs.length > 0 && (
                                  <Label
                                    variant="soft"
                                    color="warning"
                                    sx={{ height: 20, fontSize: 10 }}
                                  >
                                    Chưa trả ×{group.unpaidRegs.length}
                                  </Label>
                                )}
                              </Box>
                            )}
                        </Box>
                      </Box>
                    </Box>

                    {/* ── Expanded: registration list ── */}
                    <Collapse in={isExpanded}>
                      <Divider />
                      <Box sx={{ px: 2.5, py: 1.75 }}>
                        <Stack spacing={1.25}>
                          {group.registrations.map((r) => {
                            const canCancel = canCancelRegistration(
                              new Date(r.session.date),
                              new Date(r.session.startTime)
                            );
                            const sessionClosed = r.session.status !== 'OPEN';

                            const canPayThis = group.hasCost && !r.isPaid;

                            return (
                              <Box
                                key={r.id}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 1,
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                                  {canPayThis ? (
                                    <Checkbox
                                      size="small"
                                      checked={selectedRegIds.has(r.id)}
                                      onChange={() => toggleSelectReg(r.id)}
                                      sx={{ ml: -0.75, p: 0.5, flexShrink: 0 }}
                                    />
                                  ) : (
                                    <Box sx={{ width: 24, flexShrink: 0 }} />
                                  )}
                                  <Box sx={{ minWidth: 0 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {r.playerName}
                                    {r.isProxy && (
                                      <Box
                                        component="span"
                                        sx={{
                                          typography: 'caption',
                                          color: 'text.disabled',
                                          ml: 0.5,
                                        }}
                                      >
                                        (hộ)
                                      </Box>
                                    )}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Sân {r.courtName}
                                  </Typography>
                                  </Box>
                                </Box>

                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.75,
                                    flexShrink: 0,
                                  }}
                                >
                                  {group.hasCost && (
                                    <Label
                                      variant="soft"
                                      color={r.isPaid ? 'success' : 'warning'}
                                      sx={{ height: 20, fontSize: 10 }}
                                    >
                                      {r.isPaid ? 'Đã trả' : 'Chưa trả'}
                                    </Label>
                                  )}
                                  {canCancel && !sessionClosed ? (
                                    <Link
                                      component={RouterLink}
                                      href={paths.cancel(r.cancelToken)}
                                      variant="caption"
                                      sx={{ color: 'error.main' }}
                                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                    >
                                      Hủy
                                    </Link>
                                  ) : (
                                    <Label
                                      variant="soft"
                                      color="default"
                                      sx={{ height: 20, fontSize: 10 }}
                                    >
                                      {sessionClosed ? 'Đã đóng' : 'Hết hạn'}
                                    </Label>
                                  )}
                                </Box>
                              </Box>
                            );
                          })}
                        </Stack>
                      </Box>
                    </Collapse>
                  </Card>
                );
              })}
            </Stack>
          )
        )}
      </Stack>

      {/* ── Sticky payment bar ── */}
      {selectedRegIds.size > 0 && (
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
            <Typography variant="subtitle2">
              {selectedSessionCount} buổi · {selectedRegs.length} đăng ký
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Tổng: {totalSelected.toLocaleString('vi-VN')}đ
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            <Button size="small" color="inherit" onClick={() => setSelectedRegIds(new Set())}>
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
        onSuccess={() => setSelectedRegIds(new Set())}
      />
    </Container>
  );
}
