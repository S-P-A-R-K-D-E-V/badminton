'use client';

import { useState } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { CostDialog } from '../cost-dialog';
import { formatVND } from '../types';
import { AddCourtDialog } from '../add-court-dialog';
import { CourtManageCard } from '../court-manage-card';
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
  const [cost, setCost] = useState<AdminSessionCost>(session.cost);

  const totalConfirmed = session.courts.reduce(
    (sum, c) => sum + c.registrations.filter((r) => r.status === 'CONFIRMED').length,
    0
  );

  const existingTotal = cost
    ? cost.courtFee + cost.shuttlecockCost + cost.supplyCost + cost.otherCost
    : 0;
  const existingPerPerson =
    cost && totalConfirmed > 0 ? Math.ceil(existingTotal / totalConfirmed) : 0;

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
          <CourtManageCard key={court.id} court={court} />
        ))}
      </Stack>

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
    </Container>
  );
}
