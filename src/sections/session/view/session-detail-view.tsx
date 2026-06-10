'use client';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import Link from '@mui/material/Link';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';

import { formatDate, formatTime } from '@/lib/utils';

import { CourtCard } from '../court-card';
import { RegistrationForm } from '../registration-form';
import { RegistrationSuccess } from '../registration-success';

import type { SessionData, RegistrationResult } from '../types';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function SessionDetailView({ id }: Props) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<RegistrationResult[] | null>(null);
  const [waitlistCount, setWaitlistCount] = useState(0);

  useEffect(() => {
    fetch(`/api/sessions/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setSession(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <EmptyContent title="Không tìm thấy buổi chơi" sx={{ py: 10 }} />
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <RegistrationSuccess results={success} waitlistCount={waitlistCount} />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Link
        component={RouterLink}
        href={paths.home}
        underline="hover"
        sx={{
          mb: 2,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          color: 'text.secondary',
          typography: 'body2',
        }}
      >
        <Iconify icon="eva:arrow-ios-back-fill" width={18} />
        Lịch chơi
      </Link>

      <Stack spacing={3}>
        <Card sx={{ p: 2.5 }}>
          <Typography variant="h5" sx={{ mb: 1 }}>
            {session.title}
          </Typography>
          <Stack
            direction="row"
            spacing={2}
            flexWrap="wrap"
            useFlexGap
            sx={{ color: 'text.secondary', typography: 'body2' }}
          >
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              <Iconify width={16} icon="solar:calendar-outline" />
              {formatDate(session.date)}
            </Box>
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              <Iconify width={16} icon="solar:clock-circle-outline" />
              {formatTime(session.startTime)} – {formatTime(session.endTime)}
            </Box>
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              <Iconify width={16} icon="mingcute:location-line" />
              {session.location}
            </Box>
          </Stack>
        </Card>

        <Stack spacing={2}>
          {session.courts.map((court) => (
            <CourtCard key={court.id} court={court} />
          ))}
        </Stack>

        {session.status === 'OPEN' && (
          <RegistrationForm
            session={session}
            onSuccess={(results, count) => {
              setSuccess(results);
              setWaitlistCount(count);
            }}
          />
        )}

        {session.status === 'CLOSED' && (
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Buổi chơi này đã đóng đăng ký
            </Typography>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
