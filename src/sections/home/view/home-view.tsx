'use client';

import { m } from 'framer-motion';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { varFade, MotionContainer } from 'src/components/animate';
import { EmptyContent } from 'src/components/empty-content';

import { SessionCard } from '../session-card';

import type { HomeSessionItem } from '../types';

// ----------------------------------------------------------------------

type Props = {
  sessions: HomeSessionItem[];
  isPast: boolean;
};

export function HomeView({ sessions, isPast }: Props) {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Lịch chơi</Typography>
      </Box>

      <Tabs value={isPast ? 'past' : 'upcoming'} sx={{ mb: 3 }}>
        <Tab
          value="upcoming"
          label="Sắp tới"
          component={RouterLink}
          href={paths.home}
        />
        <Tab value="past" label="Đã qua" component={RouterLink} href={`${paths.home}?tab=past`} />
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
    </Container>
  );
}
