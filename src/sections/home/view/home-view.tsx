'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { m } from 'framer-motion';
import dynamic from 'next/dynamic';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { usePopover } from 'minimal-shared/hooks';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';
import { varFade, MotionContainer } from 'src/components/animate';
import { EmptyContent } from 'src/components/empty-content';

import { SessionCard } from '../session-card';
import { VIEW_OPTIONS } from '../session-fc-calendar';

import type { CalView } from '../session-fc-calendar';
import type { HomeSessionItem } from '../types';

// FullCalendar is client-only — lazy load to prevent SSR hydration mismatch
import type Calendar from '@fullcalendar/react';

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
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));

  const [viewMode, setViewMode] = useState<'calendar' | 'grid'>(isPast ? 'grid' : 'calendar');
  const [calView, setCalView] = useState<CalView>('dayGridMonth');
  const [calTitle, setCalTitle] = useState('');

  const calendarRef = useRef<Calendar>(null);
  const menuActions = usePopover();

  const initialCalView: CalView = mdUp ? 'dayGridMonth' : 'listWeek';

  // Sync FullCalendar view when breakpoint crosses md
  useEffect(() => {
    if (viewMode !== 'calendar') return;
    const newView: CalView = mdUp ? 'dayGridMonth' : 'listWeek';
    const api = calendarRef.current?.getApi?.();
    if (api && api.view?.type !== newView) {
      api.changeView(newView);
      setCalView(newView);
    }
  }, [mdUp, viewMode]);

  const handleChangeView = useCallback(
    (newView: CalView) => {
      calendarRef.current?.getApi?.().changeView(newView);
      setCalView(newView);
      menuActions.onClose();
    },
    [menuActions]
  );

  const move = useCallback((action: 'prev' | 'next' | 'today') => {
    calendarRef.current?.getApi?.()[action]();
  }, []);

  const selectedView = VIEW_OPTIONS.find((v) => v.value === calView) ?? VIEW_OPTIONS[0];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* ── Header row: title + view controls (always same line) ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="h4" sx={{ mr: 'auto' }}>
          Lịch chơi
        </Typography>

        {viewMode === 'calendar' ? (
          <>
            {/* View dropdown (Month / Week / Day / Agenda) */}
            <Button
              size="small"
              color="inherit"
              onClick={menuActions.onOpen}
              startIcon={<Iconify icon={selectedView.icon} width={16} />}
              endIcon={
                <Iconify
                  icon="eva:arrow-ios-downward-fill"
                  width={14}
                  sx={{ ml: -0.5, opacity: 0.7 }}
                />
              }
              sx={{ typography: 'body2' }}
            >
              {selectedView.label}
            </Button>

            {/* Switch to grid */}
            <IconButton size="small" onClick={() => setViewMode('grid')} title="Xem danh sách">
              <Iconify icon="solar:list-bold" width={18} />
            </IconButton>
          </>
        ) : (
          /* Switch to calendar */
          <IconButton
            size="small"
            onClick={() => setViewMode('calendar')}
            title="Xem lịch"
            sx={{ color: 'primary.main' }}
          >
            <Iconify icon="solar:calendar-bold" width={20} />
          </IconButton>
        )}
      </Box>

      {/* ── View dropdown popover ── */}
      <CustomPopover
        open={menuActions.open}
        anchorEl={menuActions.anchorEl}
        onClose={menuActions.onClose}
        slotProps={{ arrow: { placement: 'top-right' } }}
      >
        <MenuList sx={{ p: 0.5 }}>
          {VIEW_OPTIONS.map((opt) => (
            <MenuItem
              key={opt.value}
              selected={opt.value === calView}
              onClick={() => handleChangeView(opt.value)}
              sx={{ borderRadius: 1 }}
            >
              <Iconify icon={opt.icon} sx={{ mr: 1.5, width: 20, height: 20 }} />
              {opt.label}
            </MenuItem>
          ))}
        </MenuList>
      </CustomPopover>

      {/* ── Calendar mode ── */}
      {viewMode === 'calendar' ? (
        <>
          {/* Date navigation row */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton size="small" onClick={() => move('prev')}>
                <Iconify icon="eva:arrow-ios-back-fill" />
              </IconButton>
              <Typography
                variant="subtitle2"
                sx={{
                  minWidth: { xs: 100, sm: 160 },
                  textAlign: 'center',
                  textTransform: 'capitalize',
                }}
              >
                {calTitle}
              </Typography>
              <IconButton size="small" onClick={() => move('next')}>
                <Iconify icon="eva:arrow-ios-forward-fill" />
              </IconButton>
            </Box>

            <Button size="small" variant="outlined" color="inherit" onClick={() => move('today')}>
              Hôm nay
            </Button>
          </Box>

          <SessionFcCalendar
            sessions={sessions}
            calendarRef={calendarRef}
            initialView={initialCalView}
            onDatesSet={(title) => setCalTitle(title)}
          />
        </>
      ) : (
        /* ── Grid (list) mode ── */
        <>
          <Tabs value={isPast ? 'past' : 'upcoming'} sx={{ mb: 3 }}>
            <Tab value="upcoming" label="Sắp tới" component={RouterLink} href={paths.home} />
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
            /* 2-column grid on md+, 1 column on mobile */
            <Box
              component={MotionContainer}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 2.5,
              }}
            >
              {sessions.map((session) => (
                <m.div key={session.id} variants={varFade('inUp', { distance: 24 })}>
                  <SessionCard session={session} />
                </m.div>
              ))}
            </Box>
          )}
        </>
      )}
    </Container>
  );
}
