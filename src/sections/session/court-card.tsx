import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { Label } from 'src/components/label';

import { CourtSlotGrid } from './court-slot-grid';

import type { CourtData } from './types';

// ----------------------------------------------------------------------

type Props = {
  court: CourtData;
};

export function CourtCard({ court }: Props) {
  const booked = court._count.registrations;
  const full = booked >= court.maxSlots;
  const warn = booked >= court.warnAt;

  const statusText = full
    ? `Đầy${court.waitlistCount ? ` (${court.waitlistCount} chờ)` : ''}`
    : warn
      ? 'Sắp đầy'
      : 'Còn chỗ';

  return (
    <Card sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1">{court.name}</Typography>
        <Label color={full ? 'error' : warn ? 'warning' : 'success'} variant="soft">
          {booked}/{court.maxSlots} · {statusText}
        </Label>
      </Box>

      <CourtSlotGrid court={court} />

      {court.registrations.length > 0 && (
        <Box component="ul" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          {court.registrations.map((r, i) => (
            <Typography key={r.id} component="li" variant="caption" sx={{ color: 'text.secondary' }}>
              {i + 1}. {r.playerName}{' '}
              <Box component="span" sx={{ color: 'text.disabled' }}>
                ({r.playerRank}){r.isProxy && ` · đăng ký bởi ${r.registrantName}`}
              </Box>
            </Typography>
          ))}
        </Box>
      )}
    </Card>
  );
}
