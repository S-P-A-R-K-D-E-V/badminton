import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { formatDate, formatTime } from '@/lib/utils';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import type { HomeSessionItem } from './types';

// ----------------------------------------------------------------------

type Props = {
  session: HomeSessionItem;
};

export function SessionCard({ session }: Props) {
  const totalSlots = session.courts.reduce((s, c) => s + c.maxSlots, 0);
  const totalBooked = session.courts.reduce((s, c) => s + c._count.registrations, 0);
  const isCancelled = session.status === 'CANCELLED';
  const isFull = totalBooked >= totalSlots;
  const isWarn = totalBooked >= totalSlots * 0.8;

  const statusLabel = isCancelled ? 'Đã hủy' : isFull ? 'Đã đầy' : isWarn ? 'Sắp đầy' : 'Còn chỗ';
  const statusColor = isCancelled ? 'default' : isFull ? 'error' : isWarn ? 'warning' : 'success';

  return (
    <Card>
      <CardActionArea component={RouterLink} href={paths.session(session.id)} sx={{ p: 2.5 }}>
        <Stack spacing={1.5}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
            <Box>
              <Typography variant="subtitle1">{session.title}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
                {formatDate(session.date)}
              </Typography>
            </Box>
            <Label color={statusColor} variant="soft" sx={{ flexShrink: 0 }}>
              {statusLabel}
            </Label>
          </Box>

          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ color: 'text.secondary', typography: 'body2' }}>
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              <Iconify width={16} icon="solar:clock-circle-outline" />
              {formatTime(session.startTime)} – {formatTime(session.endTime)}
            </Box>
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              <Iconify width={16} icon="mingcute:location-line" />
              {session.location}
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {session.courts.map((court) => {
              const booked = court._count.registrations;
              const full = booked >= court.maxSlots;
              const warn = booked >= court.warnAt;
              return (
                <Label
                  key={court.id}
                  variant="outlined"
                  color={full ? 'error' : warn ? 'warning' : 'default'}
                >
                  {court.name}: {booked}/{court.maxSlots}
                </Label>
              );
            })}
          </Stack>
        </Stack>
      </CardActionArea>
    </Card>
  );
}
