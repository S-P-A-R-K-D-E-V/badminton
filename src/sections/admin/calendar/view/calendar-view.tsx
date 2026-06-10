'use client';

import type { EventInput } from '@fullcalendar/core';

import { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import listPlugin from '@fullcalendar/list';
import daygridPlugin from '@fullcalendar/daygrid';
import timegridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import Calendar from '@fullcalendar/react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import { CalendarRoot } from '../styles';

// ----------------------------------------------------------------------

type ViewType = 'dayGridMonth' | 'timeGridWeek' | 'listMonth';

const VIEW_OPTIONS: { value: ViewType; label: string }[] = [
  { value: 'dayGridMonth', label: 'Tháng' },
  { value: 'timeGridWeek', label: 'Tuần' },
  { value: 'listMonth', label: 'Danh sách' },
];

type Props = {
  events: EventInput[];
};

export function AdminCalendarView({ events }: Props) {
  const router = useRouter();
  const calendarRef = useRef<Calendar>(null);

  const [view, setView] = useState<ViewType>('dayGridMonth');
  const [title, setTitle] = useState('');

  const updateTitle = useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (api) setTitle(api.view.title);
  }, []);

  const handleChangeView = (next: ViewType) => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.changeView(next);
      setView(next);
      updateTitle();
    }
  };

  const move = (action: 'prev' | 'next' | 'today') => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api[action]();
      updateTitle();
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ mb: 3 }}>
        Lịch buổi chơi
      </Typography>

      <Card>
        <Box
          sx={{
            p: 2.5,
            pb: 2,
            gap: 2,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton onClick={() => move('prev')}>
              <Iconify icon="eva:arrow-ios-back-fill" />
            </IconButton>
            <Typography variant="h6" sx={{ minWidth: 160, textAlign: 'center' }}>
              {title}
            </Typography>
            <IconButton onClick={() => move('next')}>
              <Iconify icon="eva:arrow-ios-forward-fill" />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" variant="outlined" color="inherit" onClick={() => move('today')}>
              Hôm nay
            </Button>
            <ButtonGroup size="small" variant="outlined" color="inherit">
              {VIEW_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={view === option.value ? 'contained' : 'outlined'}
                  onClick={() => handleChangeView(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </ButtonGroup>
          </Box>
        </Box>

        <CalendarRoot sx={{ px: 2.5, pb: 2.5 }}>
          <Calendar
            ref={calendarRef}
            plugins={[daygridPlugin, timegridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale="vi"
            firstDay={1}
            headerToolbar={false}
            events={events}
            height={720}
            dayMaxEventRows={3}
            eventDisplay="block"
            datesSet={updateTitle}
            eventClick={(info) => {
              router.push(paths.admin.session(info.event.id));
            }}
            noEventsContent="Không có buổi chơi"
            buttonText={{ today: 'Hôm nay', month: 'Tháng', week: 'Tuần', list: 'Danh sách' }}
            allDayText="Cả ngày"
            moreLinkContent={(arg) => `+${arg.num} buổi`}
          />
        </CalendarRoot>
      </Card>
    </Container>
  );
}
