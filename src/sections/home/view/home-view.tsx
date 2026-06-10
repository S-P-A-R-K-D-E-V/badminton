'use client';

import { useState } from 'react';
import { m } from 'framer-motion';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { varFade, MotionContainer } from 'src/components/animate';
import { EmptyContent } from 'src/components/empty-content';

import { SessionCard } from '../session-card';
import { SessionCalendar } from '../session-calendar';

import type { HomeSessionItem } from '../types';

// ----------------------------------------------------------------------

type Props = {
  sessions: HomeSessionItem[];
  isPast: boolean;
};

export function HomeView({ sessions, isPast }: Props) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Lịch chơi</Typography>

        {!isPast && (
          <ToggleButtonGroup
            exclusive
            size="small"
            value={viewMode}
            onChange={(_, v) => v && setViewMode(v)}
          >
            <ToggleButton value="list" aria-label="Danh sách">
              <Iconify icon="solar:list-bold" width={18} />
            </ToggleButton>
            <ToggleButton value="calendar" aria-label="Lịch">
              <Iconify icon="solar:calendar-bold" width={18} />
            </ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>

      <Tabs value={isPast ? 'past' : 'upcoming'} sx={{ mb: 3 }}>
        <Tab
          value="upcoming"
          label="Sắp tới"
          component={RouterLink}
          href={paths.home}
          onClick={() => setViewMode('list')}
        />
        <Tab
          value="past"
          label="Đã qua"
          component={RouterLink}
          href={`${paths.home}?tab=past`}
        />
      </Tabs>

      {viewMode === 'calendar' && !isPast ? (
        <SessionCalendar sessions={sessions} />
      ) : sessions.length === 0 ? (
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
    </Container>
  );
}
