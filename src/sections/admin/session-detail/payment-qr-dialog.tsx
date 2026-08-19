'use client';

import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { formatShortDate } from '@/lib/utils';
import { buildQrUrl, ACCOUNT_NO, BANK_LABEL } from '@/lib/payment-qr';

import type { AdminRegistration } from './types';

// ----------------------------------------------------------------------

type SelectedReg = AdminRegistration & { courtName: string };

type PaymentRequestInfo = { id: string; code: string; totalAmount: number };

type Props = {
  open: boolean;
  onClose: () => void;
  selectedRegs: SelectedReg[];
  costPerPerson: number;
  sessionDate: string;
};

export function PaymentQrDialog({ open, onClose, selectedRegs, costPerPerson, sessionDate }: Props) {
  const [step, setStep] = useState<'creating' | 'ready' | 'error'>('creating');
  const [error, setError] = useState<string | null>(null);
  const [payReq, setPayReq] = useState<PaymentRequestInfo | null>(null);
  const createdForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      createdForRef.current = null;
      return;
    }
    const key = selectedRegs.map((r) => r.id).sort().join(',');
    if (createdForRef.current === key) return;
    createdForRef.current = key;

    setStep('creating');
    setError(null);
    setPayReq(null);

    fetch('/api/payment-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationIds: selectedRegs.map((r) => r.id) }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Có lỗi xảy ra, thử lại sau');
        setPayReq(data);
        setStep('ready');
      })
      .catch((e: Error) => {
        setError(e.message || 'Lỗi kết nối, thử lại sau');
        setStep('error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>Mã QR thanh toán</DialogTitle>

      <DialogContent>
        {step === 'creating' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {step === 'error' && <Alert severity="error">{error}</Alert>}

        {step === 'ready' && payReq && (
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Box sx={{ textAlign: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={buildQrUrl(payReq.totalAmount, payReq.code)}
                alt="VietQR Payment"
                style={{ width: '100%', maxWidth: 240, borderRadius: 8, display: 'block', margin: '0 auto' }}
              />
            </Box>

            <Box sx={{ bgcolor: 'background.neutral', borderRadius: 1.5, p: 1.75 }}>
              <Stack spacing={0.75}>
                {[
                  { label: 'Ngân hàng', value: BANK_LABEL },
                  { label: 'Số tài khoản', value: ACCOUNT_NO },
                  {
                    label: 'Số tiền',
                    value: `${payReq.totalAmount.toLocaleString('vi-VN')}đ`,
                    color: 'primary.main',
                  },
                  { label: 'Nội dung', value: payReq.code },
                  { label: 'Ngày', value: formatShortDate(sessionDate) },
                ].map((row) => (
                  <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0 }}>
                      {row.label}
                    </Typography>
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      sx={{ textAlign: 'right', color: row.color ?? 'text.primary' }}
                    >
                      {row.value}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.75, display: 'block' }}>
                {selectedRegs.length} người được chọn
              </Typography>
              <Stack spacing={0.5}>
                {selectedRegs.map((r) => (
                  <Box
                    key={r.id}
                    sx={{ display: 'flex', justifyContent: 'space-between', typography: 'caption' }}
                  >
                    <span>
                      {r.playerName} · {r.courtName}
                    </span>
                    <b>{costPerPerson.toLocaleString('vi-VN')}đ</b>
                  </Box>
                ))}
              </Stack>
            </Box>

            <Divider />

            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Gửi mã QR này cho người chuyển khoản.
            </Typography>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button color="inherit" onClick={onClose}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}
