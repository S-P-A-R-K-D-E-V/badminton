'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import dynamic from 'next/dynamic';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { varFade, MotionContainer } from 'src/components/animate';
import { EmptyContent } from 'src/components/empty-content';

import { SessionCard } from '../session-card';

import type { HomeSessionItem } from '../types';

// ----------------------------------------------------------------------

// FullCalendar is client-only — dynamic import prevents SSR issues
const SessionFcCalendar = dynamic(
  () => import('../session-fc-calendar').then((mod) => mod.SessionFcCalendar),
  {
    ssr: false,
    loading: () => (
      <Card sx={{ p: 2.5 }}>
        <Skeleton variant="rectangular" height={520} sx={{ borderRadius: 1 }} />
      </Card>
    ),
  }
);

// ----------------------------------------------------------------------

type Props = {
  sessions: HomeSessionItem[];
  isPast: boolean;
};

export function HomeView({ sessions, isPast }: Props) {
  // Default: calendar for upcoming, grid for past tab
  const [viewMode, setViewMode] = useState<'calendar' | 'grid'>(isPast ? 'grid' : 'calendar');

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Lịch chơi</Typography>

        {/* Show "switch to calendar" icon only when in grid mode */}
        {viewMode === 'grid' && (
          <IconButton
            size="small"
            onClick={() => setViewMode('calendar')}
            title="Chuyển sang lịch"
            sx={{ color: 'primary.main' }}
          >
            <Iconify icon="solar:calendar-bold" width={22} />
          </IconButton>
        )}
      </Box>

      {viewMode === 'calendar' ? (
        <SessionFcCalendar sessions={sessions} onSwitchToGrid={() => setViewMode('grid')} />
      ) : (
        <>
          <Tabs value={isPast ? 'past' : 'upcoming'} sx={{ mb: 3 }}>
            <Tab
              value="upcoming"
              label="Sắp tới"
              component={RouterLink}
              href={paths.home}
            />
            <Tab
              value="past"
              label="Đã qua"
              component={RouterLink}
              href={`${paths.home}?tab=past`}
            />
          </Tabs>

          {sessions.length === 0 ? (
            <EmptyContent
              title={isPast ? 'Chưa có lịch sử buổi chơi' : 'Chưa có lịch chơi nào sắp tới'}
              sx={{ py: 10 }}
            />
          ) : (
            <Stack component={MotionContainer} spacing={2.5}>
              {sessions.map((session) => (
                <m.div key={session.id} variants={varFade('inUp', { distance: 24 })}>
                  <SessionCard session={session} />
                </m.div>
              ))}
            </Stack>
          )}
        </>
      )}
    </Container>
  );
}
