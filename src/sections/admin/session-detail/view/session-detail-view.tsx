'use client';

import { useMemo, useState, useCallback } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { CostDialog } from '../cost-dialog';
import { formatVND } from '../types';
import { AddCourtDialog } from '../add-court-dialog';
import { CourtManageCard } from '../court-manage-card';
import { PaymentQrDialog } from '../payment-qr-dialog';
import { SessionStatusToolbar } from '../session-status-toolbar';

import type { AdminSession, AdminSessionCost } from '../types';

// ----------------------------------------------------------------------

type Props = {
  session: AdminSession;
  title: string;
  subtitle: string;
};

export function AdminSessionDetailView({ session, title, subtitle }: Props) {
  const costDialog = useBoolean();
  const addCourtDialog = useBoolean();
  const qrDialog = useBoolean();
  const [cost, setCost] = useState<AdminSessionCost>(session.cost);
  const [selectedRegIds, setSelectedRegIds] = useState<Set<string>>(new Set());

  const totalConfirmed = session.courts.reduce(
    (sum, c) => sum + c.registrations.filter((r) => r.status === 'CONFIRMED').length,
    0
  );

  const existingTotal = cost
    ? cost.courtFee + cost.shuttlecockCost + cost.supplyCost + cost.otherCost
    : 0;
  const existingPerPerson =
    cost && totalConfirmed > 0 ? Math.ceil(existingTotal / totalConfirmed) : 0;

  const canSelectForQr = existingTotal > 0 && existingPerPerson > 0;

  const toggleSelectReg = useCallback((regId: string) => {
    setSelectedRegIds((prev) => {
      const next = new Set(prev);
      if (next.has(regId)) next.delete(regId);
      else next.add(regId);
      return next;
    });
  }, []);

  const selectedRegs = useMemo(
    () =>
      session.courts.flatMap((c) =>
        c.registrations
          .filter((r) => selectedRegIds.has(r.id) && !r.isPaid)
          .map((r) => ({ ...r, courtName: c.name }))
      ),
    [session.courts, selectedRegIds]
  );

  return (
    <Container maxWidth="lg">
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">{title}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {subtitle}
          </Typography>
        </Box>

        <SessionStatusToolbar
          sessionId={session.id}
          status={session.status}
          onAddCourt={addCourtDialog.onTrue}
          onToggleCost={costDialog.onTrue}
        />

        {cost && existingTotal > 0 && (
          <Box
            sx={(theme) => ({
              p: 2,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: 'warning.lighter',
              color: 'warning.darker',
              typography: 'body2',
              ...theme.applyStyles('dark', {
                bgcolor: 'warning.darker',
                color: 'warning.lighter',
              }),
            })}
          >
            <span>
              Tổng chi phí: <strong>{formatVND(existingTotal)}</strong>
            </span>
            {existingPerPerson > 0 && (
              <span>
                Mỗi người: <strong>{formatVND(existingPerPerson)}</strong>
              </span>
            )}
          </Box>
        )}

        {session.courts.map((court) => (
          <CourtManageCard
            key={court.id}
            court={court}
            canSelectForQr={canSelectForQr}
            selectedRegIds={selectedRegIds}
            onToggleSelect={toggleSelectReg}
          />
        ))}
      </Stack>

      {selectedRegIds.size > 0 && !qrDialog.value && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            width: { xs: 'calc(100% - 32px)', sm: 480 },
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            borderRadius: 2,
            zIndex: (theme) => theme.zIndex.appBar,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2">{selectedRegs.length} người được chọn</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Tổng: {formatVND(selectedRegs.length * existingPerPerson)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            <Button size="small" color="inherit" onClick={() => setSelectedRegIds(new Set())}>
              Bỏ chọn
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<Iconify icon="solar:qr-code-bold" width={16} />}
              onClick={qrDialog.onTrue}
            >
              Tạo QR
            </Button>
          </Box>
        </Paper>
      )}

      <CostDialog
        open={costDialog.value}
        onClose={costDialog.onFalse}
        sessionId={session.id}
        cost={cost}
        totalConfirmed={totalConfirmed}
        onSaved={setCost}
      />

      <AddCourtDialog
        open={addCourtDialog.value}
        onClose={addCourtDialog.onFalse}
        sessionId={session.id}
      />

      <PaymentQrDialog
        open={qrDialog.value}
        onClose={qrDialog.onFalse}
        selectedRegs={selectedRegs}
        costPerPerson={existingPerPerson}
        sessionDate={session.date}
      />
    </Container>
  );
}
