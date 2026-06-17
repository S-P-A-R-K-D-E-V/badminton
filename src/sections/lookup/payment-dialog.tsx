'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LoadingButton from '@mui/lab/LoadingButton';
import Alert from '@mui/material/Alert';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const BANK_ID = 'MB'
const ACCOUNT_NO = '2510199966668'
const ACCOUNT_NAME = 'VŨ XUÂN BÌNH'

function buildAddInfo(name: string, players: string[], sessionDate: string): string {
  const d = new Date(sessionDate)
  const day = String(d.getUTCDate()).padStart(2, '0')
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const year = d.getUTCFullYear()
  const who = players.length > 0 ? ` (${players.join(', ')})` : ''
  return `Cầu lông - ${name}${who} ${day}${month}${year}`
}

function buildQrUrl(
  totalAmount: number,
  name: string,
  players: string[],
  sessionDate: string
): string {
  const addInfo = encodeURIComponent(buildAddInfo(name, players, sessionDate))
  return (
    `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png` +
    `?amount=${totalAmount}&addInfo=${addInfo}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`
  )
}

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

type Props = {
  open: boolean;
  onClose: () => void;
  selectedRegs: RegItem[];
  name: string;
  phone: string;
  onSuccess: () => void;
};

export function PaymentDialog({ open, onClose, selectedRegs, name, phone, onSuccess }: Props) {
  const [step, setStep] = useState<'qr' | 'sending' | 'done'>('qr');
  const [error, setError] = useState<string | null>(null);

  const totalAmount = selectedRegs.reduce((sum, r) => sum + r.costPerPerson, 0);

  const earliestDate = selectedRegs.reduce((min, r) => (r.session.date < min ? r.session.date : min), selectedRegs[0]?.session.date ?? '');

  const playerNames = selectedRegs.map((r) => r.playerName);

  const qrUrl = selectedRegs.length > 0 ? buildQrUrl(totalAmount, name, playerNames, earliestDate) : '';

  const handleSend = async () => {
    setStep('sending');
    setError(null);
    try {
      const res = await fetch('/api/my-registrations/notify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationIds: selectedRegs.map((r) => r.id),
          name,
          phone,
        }),
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
    setStep('qr');
    setError(null);
    onClose();
  };

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
        {step === 'done' ? (
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
        ) : (
          /* ── QR + details state ── */
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            {/* QR code */}
            <Box sx={{ textAlign: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                alt="VietQR Payment"
                style={{ width: '100%', maxWidth: 240, borderRadius: 8, display: 'block', margin: '0 auto' }}
              />
            </Box>

            {/* Payment info */}
            <Box sx={{ bgcolor: 'background.neutral', borderRadius: 1.5, p: 1.75 }}>
              <Stack spacing={0.75}>
                {[
                  { label: 'Ngân hàng', value: 'MB Bank' },
                  { label: 'Số tài khoản', value: ACCOUNT_NO },
                  {
                    label: 'Số tiền',
                    value: `${totalAmount.toLocaleString('vi-VN')}đ`,
                    color: 'primary.main',
                  },
                  { label: 'Nội dung', value: buildAddInfo(name, playerNames, earliestDate) },
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
                      {r.isProxy ? ' (hộ)' : ''} · Sân {r.courtName}
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
        {step !== 'done' && (
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
