'use client';

import type { EventInput, EventContentArg } from '@fullcalendar/core';
import type { RefObject } from 'react';

import { useRouter } from 'next/navigation';

import Calendar from '@fullcalendar/react';
import listPlugin from '@fullcalendar/list';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { CalendarRoot } from 'src/sections/admin/calendar/styles';

import type { HomeSessionItem } from './types';

// ----------------------------------------------------------------------

export type CalView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';

export const VIEW_OPTIONS: { value: CalView; label: string; icon: string }[] = [
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

// Custom event renderer — colored pill with accent bar, dot, bold time and title.
// List view keeps FullCalendar's default rendering (returns undefined).
function renderEventContent(arg: EventContentArg) {
  if (arg.view.type.startsWith('list')) return undefined;

  const color = arg.event.backgroundColor || arg.event.borderColor || '#22C55E';
  const isTimeGrid = arg.view.type.startsWith('timeGrid');

  return (
    <Box
      sx={{
        width: '100%',
        minWidth: 0,
        display: 'flex',
        flexDirection: isTimeGrid ? 'column' : 'row',
        alignItems: isTimeGrid ? 'flex-start' : 'center',
        gap: isTimeGrid ? 0.25 : 0.625,
        px: 0.75,
        py: isTimeGrid ? 0.5 : 0.375,
        borderRadius: 0.75,
        borderLeft: `3px solid ${color}`,
        bgcolor: `${color}22`,
        color: 'text.primary',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'background-color 0.15s',
        '&:hover': { bgcolor: `${color}3d` },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, minWidth: 0 }}>
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: color,
            flexShrink: 0,
            boxShadow: `0 0 0 2px ${color}33`,
          }}
        />
        {arg.timeText && (
          <Box component="span" sx={{ fontSize: 11, fontWeight: 700, color, lineHeight: 1.4 }}>
            {arg.timeText}
          </Box>
        )}
      </Box>
      <Box
        component="span"
        sx={{
          fontSize: 12,
          fontWeight: 600,
          lineHeight: 1.3,
          maxWidth: '100%',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}
      >
        {arg.event.title}
      </Box>
    </Box>
  );
}

// Use floating ISO (no Z) so FullCalendar treats times as local — avoids UTC timezone shift
function toFloatingISO(date: Date | string, time: Date | string): string {
  const d = new Date(date);
  const t = new Date(time);
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const h = String(t.getUTCHours()).padStart(2, '0');
  const min = String(t.getUTCMinutes()).padStart(2, '0');
  return `${y}-${mo}-${day}T${h}:${min}:00`;
}

// ----------------------------------------------------------------------

type Props = {
  sessions: HomeSessionItem[];
  calendarRef: RefObject<Calendar | null>;
  initialView: CalView;
  onDatesSet: (title: string) => void;
};

export function SessionFcCalendar({ sessions, calendarRef, initialView, onDatesSet }: Props) {
  const router = useRouter();

  const events: EventInput[] = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    start: toFloatingISO(s.date, s.startTime),
    end: toFloatingISO(s.date, s.endTime),
    color: getEventColor(s),
  }));

  return (
    <>
      <CalendarRoot
        sx={{
          '.fc.fc-media-screen': { minHeight: { xs: 460, md: 580 } },
          // Strip the default soft-block chrome so the custom pill renders cleanly
          '& .fc .fc-event': {
            background: 'transparent !important',
            borderColor: 'transparent !important',
            boxShadow: 'none',
          },
          '& .fc .fc-event .fc-event-main': {
            p: 0,
            backgroundColor: 'transparent',
            '&::before': { display: 'none' },
          },
          '& .fc .fc-event .fc-event-main-frame': { filter: 'none' },
          '& .fc .fc-daygrid-event': { marginTop: '3px' },
        }}
      >
        <Calendar
          ref={calendarRef as React.RefObject<Calendar>}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView={initialView}
          locale="vi"
          firstDay={1}
          headerToolbar={false}
          events={events}
          dayMaxEventRows={3}
          eventDisplay="block"
          eventContent={renderEventContent}
          datesSet={(info) => onDatesSet(info.view.title)}
          eventClick={(info) => router.push(paths.session(info.event.id))}
          noEventsContent="Không có buổi chơi"
          allDayText="Cả ngày"
          moreLinkContent={(arg) => `+${arg.num} buổi`}
          buttonText={{ today: 'Hôm nay', month: 'Tháng', week: 'Tuần', day: 'Ngày', list: 'DS' }}
        />
      </CalendarRoot>

      {/* Color legend */}
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
    </>
  );
}
