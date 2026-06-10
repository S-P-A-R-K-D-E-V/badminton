'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';

import { toast } from 'src/components/snackbar';
import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { GENDER_LABEL } from './types';

import type { AdminCourt, AdminRegistration } from './types';

// ----------------------------------------------------------------------

type Props = {
  court: AdminCourt;
};

export function CourtManageCard({ court }: Props) {
  const router = useRouter();

  const confirmDeleteCourt = useBoolean();
  const [cancelTarget, setCancelTarget] = useState<AdminRegistration | null>(null);
  const [busy, setBusy] = useState(false);

  const booked = court._count.registrations;
  const full = booked >= court.maxSlots;
  const warn = booked >= court.warnAt;
  const confirmed = court.registrations.filter((r) => r.status === 'CONFIRMED');
  const waitlist = court.registrations.filter((r) => r.status === 'WAITLIST');

  async function togglePayment(regId: string) {
    await fetch(`/api/admin/registrations/${regId}/payment`, { method: 'POST' });
    router.refresh();
  }

  async function cancelRegistration() {
    if (!cancelTarget) return;
    setBusy(true);
    const res = await fetch(`/api/admin/registrations/${cancelTarget.id}/cancel`, {
      method: 'POST',
    });
    setBusy(false);
    setCancelTarget(null);
    if (res.ok) {
      toast.success(`Đã hủy đăng ký của ${cancelTarget.playerName}`);
      router.refresh();
    } else {
      toast.error('Hủy đăng ký thất bại');
    }
  }

  async function deleteCourt() {
    setBusy(true);
    const res = await fetch(`/api/admin/courts/${court.id}`, { method: 'DELETE' });
    setBusy(false);
    confirmDeleteCourt.onFalse();
    if (res.ok) {
      toast.success(`Đã xóa ${court.name}`);
      router.refresh();
    } else {
      toast.error('Xóa sân thất bại');
    }
  }

  const renderRow = (r: AdminRegistration, index: number, isWaitlist: boolean) => (
    <TableRow key={r.id} hover sx={isWaitlist ? { bgcolor: 'action.hover' } : undefined}>
      <TableCell sx={{ color: 'text.disabled', width: 40 }}>{index + 1}</TableCell>
      <TableCell>
        <Typography variant="subtitle2">{r.playerName}</Typography>
      </TableCell>
      <TableCell>
        <Label variant="soft" color={isWaitlist ? 'warning' : 'info'}>
          {r.playerRank}
        </Label>
      </TableCell>
      <TableCell>{GENDER_LABEL[r.playerGender] ?? r.playerGender}</TableCell>
      <TableCell>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {r.isProxy ? `${r.registrantName} (${r.registrantPhone})` : r.registrantPhone}
        </Typography>
      </TableCell>
      <TableCell align="center">
        {!isWaitlist && (
          <Checkbox
            checked={r.isPaid}
            onChange={() => togglePayment(r.id)}
            color="success"
            inputProps={{ 'aria-label': `Đã trả tiền: ${r.playerName}` }}
          />
        )}
      </TableCell>
      <TableCell align="right">
        <Button size="small" color="error" onClick={() => setCancelTarget(r)}>
          {isWaitlist ? 'Xóa' : 'Hủy'}
        </Button>
      </TableCell>
    </TableRow>
  );

  return (
    <Card>
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="subtitle1">{court.name}</Typography>
          <Label variant="soft" color={full ? 'error' : warn ? 'warning' : 'success'}>
            {booked}/{court.maxSlots} {full ? 'Đầy' : warn ? 'Sắp đầy' : 'Còn chỗ'}
          </Label>
        </Box>
        <Button size="small" color="error" onClick={confirmDeleteCourt.onTrue}>
          Xóa sân
        </Button>
      </Box>

      {court.registrations.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 4 }}>
          Chưa có đăng ký
        </Typography>
      ) : (
        <Scrollbar>
          <Table size="small" sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Tên</TableCell>
                <TableCell>Rank</TableCell>
                <TableCell>GT</TableCell>
                <TableCell>Đăng ký bởi</TableCell>
                <TableCell align="center">Đã trả</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {confirmed.map((r, i) => renderRow(r, i, false))}

              {waitlist.length > 0 && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 1, bgcolor: 'action.hover' }}>
                    <Label variant="soft" color="warning">
                      Hàng chờ ({waitlist.length})
                    </Label>
                  </TableCell>
                </TableRow>
              )}
              {waitlist.map((r, i) => renderRow(r, i, true))}
            </TableBody>
          </Table>
        </Scrollbar>
      )}

      <ConfirmDialog
        open={confirmDeleteCourt.value}
        onClose={confirmDeleteCourt.onFalse}
        title="Xóa sân"
        content={`Xóa ${court.name}? Tất cả đăng ký sẽ bị xóa theo.`}
        action={
          <Button variant="contained" color="error" disabled={busy} onClick={deleteCourt}>
            Xóa sân
          </Button>
        }
      />

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Hủy đăng ký"
        content={cancelTarget ? `Hủy đăng ký của ${cancelTarget.playerName}?` : ''}
        action={
          <Button variant="contained" color="error" disabled={busy} onClick={cancelRegistration}>
            Hủy đăng ký
          </Button>
        }
      />
    </Card>
  );
}
