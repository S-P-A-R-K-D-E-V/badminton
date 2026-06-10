'use client';

import type { EventInput } from '@fullcalendar/core';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import Calendar from '@fullcalendar/react';
import listPlugin from '@fullcalendar/list';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { usePopover } from 'minimal-shared/hooks';

import { paths } from 'src/routes/paths';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

import { CalendarRoot } from 'src/sections/admin/calendar/styles';

import type { HomeSessionItem } from './types';

// ----------------------------------------------------------------------

type CalView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';

const VIEW_OPTIONS: { value: CalView; label: string; icon: string }[] = [
  { value: 'dayGridMonth', label: 'Tháng', icon: 'mingcute:calendar-month-line' },
  { value: 'timeGridWeek', label: 'Tuần', icon: 'mingcute:calendar-week-line' },
  { value: 'timeGridDay', label: 'Ngày', icon: 'mingcute:calendar-day-line' },
  { value: 'listWeek', label: 'Agenda', icon: 'fluent:calendar-agenda-24-regular' },
];

function getEventColor(session: HomeSessionItem): string {
  if (session.status === 'CANCELLED') return '#FF5630';
  if (session.status === 'CLOSED') return '#919EAB';
  const totalSlots = session.courts.reduce((s, c) => s + c.maxSlots, 0);
  const totalBooked = session.courts.reduce((s, c) => s + c._count.registrations, 0);
  if (totalSlots > 0 && totalBooked >= totalSlots) return '#FF5630';
  if (totalSlots > 0 && totalBooked >= totalSlots * 0.8) return '#FFAB00';
  return '#22C55E';
}

function combineDateTime(date: Date | string, time: Date | string): Date {
  const d = new Date(date);
  const t = new Date(time);
  d.setHours(t.getHours(), t.getMinutes(), 0, 0);
  return d;
}

// ----------------------------------------------------------------------

type Props = {
  sessions: HomeSessionItem[];
  onSwitchToGrid: () => void;
};

export function SessionFcCalendar({ sessions, onSwitchToGrid }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));
  const calendarRef = useRef<Calendar>(null);
  const menuActions = usePopover();

  const [view, setView] = useState<CalView>('dayGridMonth');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initialView: CalView = mdUp ? 'dayGridMonth' : 'listWeek';
    const api = calendarRef.current?.getApi();
    if (api && api.view.type !== initialView) {
      api.changeView(initialView);
      setView(initialView);
      setTitle(api.view.title);
    }
  }, [mdUp]);

  const updateTitle = useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (api) setTitle(api.view.title);
  }, []);

  const handleChangeView = useCallback(
    (newView: CalView) => {
      const api = calendarRef.current?.getApi();
      if (api) {
        api.changeView(newView);
        setView(newView);
        setTitle(api.view.title);
      }
      menuActions.onClose();
    },
    [menuActions]
  );

  const move = useCallback((action: 'prev' | 'next' | 'today') => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api[action]();
      setTitle(api.view.title);
    }
  }, []);

  const events: EventInput[] = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    start: combineDateTime(s.date, s.startTime).toISOString(),
    end: combineDateTime(s.date, s.endTime).toISOString(),
    color: getEventColor(s),
    extendedProps: { location: s.location, status: s.status },
  }));

  const selectedView = VIEW_OPTIONS.find((v) => v.value === view) ?? VIEW_OPTIONS[0];

  return (
    <Box>
      {/* Toolbar */}
      <Box
        sx={{
          mb: 1,
          gap: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        {/* View switcher dropdown */}
        <Button
          size="small"
          color="inherit"
          onClick={menuActions.onOpen}
          startIcon={<Iconify icon={selectedView.icon} />}
          endIcon={
            <Iconify icon="eva:arrow-ios-downward-fill" width={16} sx={{ ml: -0.5, opacity: 0.7 }} />
          }
          sx={{ typography: 'body2' }}
        >
          {selectedView.label}
        </Button>

        {/* Date navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton size="small" onClick={() => move('prev')}>
            <Iconify icon="eva:arrow-ios-back-fill" />
          </IconButton>
          <Typography
            variant="subtitle2"
            sx={{ minWidth: { xs: 100, sm: 150 }, textAlign: 'center', textTransform: 'capitalize' }}
          >
            {title}
          </Typography>
          <IconButton size="small" onClick={() => move('next')}>
            <Iconify icon="eva:arrow-ios-forward-fill" />
          </IconButton>
        </Box>

        {/* Today + grid toggle */}
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Button size="small" color="inherit" variant="outlined" onClick={() => move('today')}>
            Hôm nay
          </Button>
          <IconButton
            size="small"
            onClick={onSwitchToGrid}
            sx={{ ml: 0.5 }}
            title="Xem dạng danh sách"
          >
            <Iconify icon="solar:list-bold" width={18} />
          </IconButton>
        </Box>
      </Box>

      {/* View dropdown popover */}
      <CustomPopover
        open={menuActions.open}
        anchorEl={menuActions.anchorEl}
        onClose={menuActions.onClose}
        slotProps={{ arrow: { placement: 'top-left' } }}
      >
        <MenuList sx={{ p: 0.5 }}>
          {VIEW_OPTIONS.map((option) => (
            <MenuItem
              key={option.value}
              selected={option.value === view}
              onClick={() => handleChangeView(option.value)}
              sx={{ borderRadius: 1 }}
            >
              <Iconify icon={option.icon} sx={{ mr: 1.5, width: 20, height: 20 }} />
              {option.label}
            </MenuItem>
          ))}
        </MenuList>
      </CustomPopover>

      {/* Calendar */}
      <CalendarRoot
        sx={{
          position: 'relative',
          '.fc.fc-media-screen': { minHeight: { xs: 460, md: 580 } },
        }}
      >
        {loading && (
          <LinearProgress
            color="inherit"
            sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, zIndex: 1 }}
          />
        )}

        <Calendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="vi"
          firstDay={1}
          headerToolbar={false}
          events={events}
          dayMaxEventRows={3}
          eventDisplay="block"
          datesSet={updateTitle}
          loading={(isLoading) => setLoading(isLoading)}
          eventClick={(info) => router.push(paths.session(info.event.id))}
          noEventsContent="Không có buổi chơi"
          allDayText="Cả ngày"
          moreLinkContent={(arg) => `+${arg.num} buổi`}
          buttonText={{
            today: 'Hôm nay',
            month: 'Tháng',
            week: 'Tuần',
            day: 'Ngày',
            list: 'Danh sách',
          }}
        />
      </CalendarRoot>

      {/* Legend */}
      <Box sx={{ mt: 1.5, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {[
          { color: '#22C55E', label: 'Còn chỗ' },
          { color: '#FFAB00', label: 'Sắp đầy' },
          { color: '#FF5630', label: 'Đã đầy / Hủy' },
          { color: '#919EAB', label: 'Đã đóng' },
        ].map((item) => (
          <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
