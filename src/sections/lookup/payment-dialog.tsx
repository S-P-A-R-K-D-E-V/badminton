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
import LoadingButton from '@mui/lab/LoadingButton';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

import { formatShortDate } from '@/lib/utils';
import { buildQrUrl, ACCOUNT_NO, BANK_LABEL } from '@/lib/payment-qr';

// ----------------------------------------------------------------------

type RegItem = {
  id: string;
  playerName: string;
  isProxy: boolean;
  courtName: string;
  costPerPerson: number;
  session: {
    title: string;
    date: string;
  };
};

type PaymentRequestInfo = { id: string; code: string; totalAmount: number };

type Props = {
  open: boolean;
  onClose: () => void;
  selectedRegs: RegItem[];
  onSuccess: () => void;
};

export function PaymentDialog({ open, onClose, selectedRegs, onSuccess }: Props) {
  const [step, setStep] = useState<'creating' | 'qr' | 'sending' | 'done' | 'error'>('creating');
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
        setStep('qr');
      })
      .catch((e: Error) => {
        setError(e.message || 'Lỗi kết nối, thử lại sau');
        setStep('error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSend = async () => {
    if (!payReq) return;
    setStep('sending');
    setError(null);
    try {
      const res = await fetch('/api/my-registrations/notify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentRequestId: payReq.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Có lỗi xảy ra, thử lại sau');
        setStep('qr');
      } else {
        setStep('done');
        onSuccess();
      }
    } catch {
      setError('Lỗi kết nối, thử lại sau');
      setStep('qr');
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const dates = Array.from(new Set(selectedRegs.map((r) => r.session.date))).sort();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        {step === 'done' ? 'Đã gửi thông báo' : 'Thanh toán'}
      </DialogTitle>

      <DialogContent>
        {step === 'creating' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {step === 'error' && <Alert severity="error">{error}</Alert>}

        {step === 'done' && (
          /* ── Success state ── */
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Iconify
              icon="solar:check-circle-bold"
              width={64}
              sx={{ color: 'success.main', mb: 2 }}
            />
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Đã gửi thông báo đến nhóm Telegram
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Admin sẽ xác nhận sau khi kiểm tra. Tra cứu lại để xem trạng thái cập nhật.
            </Typography>
          </Box>
        )}

        {(step === 'qr' || step === 'sending') && payReq && (
          /* ── QR + details state ── */
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            {/* QR code */}
            <Box sx={{ textAlign: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={buildQrUrl(payReq.totalAmount, payReq.code)}
                alt="VietQR Payment"
                style={{ width: '100%', maxWidth: 240, borderRadius: 8, display: 'block', margin: '0 auto' }}
              />
            </Box>

            {/* Payment info */}
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
                  { label: 'Ngày', value: dates.map(formatShortDate).join(', ') },
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

            {/* Selected registrations */}
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.75, display: 'block' }}>
                {selectedRegs.length} đăng ký được chọn
              </Typography>
              <Stack spacing={0.5}>
                {selectedRegs.map((r) => (
                  <Box
                    key={r.id}
                    sx={{ display: 'flex', justifyContent: 'space-between', typography: 'caption' }}
                  >
                    <span>
                      {r.playerName}
                      {r.isProxy ? ' (hộ)' : ''} · {r.courtName}
                    </span>
                    <b>{r.costPerPerson.toLocaleString('vi-VN')}đ</b>
                  </Box>
                ))}
              </Stack>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <Divider />

            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Sau khi chuyển khoản, bấm &ldquo;Gửi thông báo&rdquo; để admin xác nhận trong nhóm Telegram.
            </Typography>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button color="inherit" onClick={handleClose}>
          {step === 'done' ? 'Đóng' : 'Hủy'}
        </Button>
        {(step === 'qr' || step === 'sending') && (
          <LoadingButton
            variant="contained"
            loading={step === 'sending'}
            onClick={handleSend}
            startIcon={<Iconify icon="logos:telegram" width={16} />}
          >
            Gửi thông báo
          </LoadingButton>
        )}
      </DialogActions>
    </Dialog>
  );
}
