'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { toast } from 'src/components/snackbar';

import { formatVND } from './types';

import type { AdminSessionCost } from './types';

// ----------------------------------------------------------------------

const COST_FIELDS = [
  { label: 'Tiền sân', key: 'courtFee' },
  { label: 'Tiền cầu', key: 'shuttlecockCost' },
  { label: 'Nước / phụ phí', key: 'supplyCost' },
  { label: 'Chi phí khác', key: 'otherCost' },
] as const;

type CostFormState = {
  courtFee: number;
  shuttlecockCost: number;
  supplyCost: number;
  otherCost: number;
  note: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  cost: AdminSessionCost;
  totalConfirmed: number;
  onSaved: (cost: NonNullable<AdminSessionCost>) => void;
};

export function CostDialog({ open, onClose, sessionId, cost, totalConfirmed, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CostFormState>({
    courtFee: cost?.courtFee ?? 0,
    shuttlecockCost: cost?.shuttlecockCost ?? 0,
    supplyCost: cost?.supplyCost ?? 0,
    otherCost: cost?.otherCost ?? 0,
    note: cost?.note ?? '',
  });

  const total = form.courtFee + form.shuttlecockCost + form.supplyCost + form.otherCost;
  const perPerson = totalConfirmed > 0 ? Math.ceil(total / totalConfirmed) : 0;

  async function saveCost() {
    setSaving(true);
    const res = await fetch(`/api/admin/sessions/${sessionId}/cost`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      const updated = await res.json();
      toast.success('Đã lưu chi phí');
      onSaved(updated);
      onClose();
    } else {
      toast.error('Lưu chi phí thất bại');
    }
  }

  return (
    <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
      <DialogTitle>Quản lý chi phí</DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
            {COST_FIELDS.map(({ label, key }) => (
              <TextField
                key={key}
                label={label}
                type="number"
                size="small"
                value={form[key]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [key]: Math.max(0, Number(e.target.value)) }))
                }
                slotProps={{ htmlInput: { min: 0 } }}
              />
            ))}
          </Box>

          <TextField
            label="Ghi chú"
            size="small"
            value={form.note}
            placeholder="VD: Sân Lê Văn Sỹ 4 tiếng"
            onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
          />

          {total > 0 && (
            <Box
              sx={(theme) => ({
                p: 2,
                borderRadius: 1.5,
                bgcolor: 'warning.lighter',
                ...theme.applyStyles('dark', { bgcolor: 'warning.darker' }),
              })}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Tổng:</Typography>
                <Typography variant="subtitle2">{formatVND(total)}</Typography>
              </Box>
              {perPerson > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="body2">Mỗi người ({totalConfirmed}):</Typography>
                  <Typography variant="subtitle2">{formatVND(perPerson)}</Typography>
                </Box>
              )}
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Đóng
        </Button>
        <LoadingButton variant="contained" color="warning" loading={saving} onClick={saveCost}>
          Lưu chi phí
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
