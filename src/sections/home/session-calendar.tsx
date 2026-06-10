'use client';

import { useState, useMemo } from 'react';
import { m } from 'framer-motion';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  getDay,
  format,
} from 'date-fns';
import { vi } from 'date-fns/locale';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import { varAlpha } from 'minimal-shared/utils';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { varFade, MotionContainer } from 'src/components/animate';

import { SessionCard } from './session-card';
import type { HomeSessionItem } from './types';

// ----------------------------------------------------------------------

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

type Props = { sessions: HomeSessionItem[] };

export function SessionCalendar({ sessions }: Props) {
  const theme = useTheme();

  const initialMonth = sessions.length > 0 ? new Date(sessions[0].date) : new Date();
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, HomeSessionItem[]>();
    sessions.forEach((s) => {
      const key = format(new Date(s.date), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return map;
  }, [sessions]);

  const calendarData = useMemo(() => {
    const firstDay = startOfMonth(currentMonth);
    const lastDay = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: firstDay, end: lastDay });
    // Monday-first: shift Sunday(0) to position 6
    const leadingBlanks = (getDay(firstDay) + 6) % 7;
    return { days, leadingBlanks };
  }, [currentMonth]);

  const selectedSessions = useMemo(() => {
    if (!selectedDate) return null;
    const key = format(selectedDate, 'yyyy-MM-dd');
    return sessionsByDate.get(key) ?? [];
  }, [selectedDate, sessionsByDate]);

  const getDateStatus = (day: Date) => {
    const key = format(day, 'yyyy-MM-dd');
    const daySessions = sessionsByDate.get(key);
    if (!daySessions) return null;
    if (daySessions.some((s) => s.status === 'OPEN')) return 'open';
    return 'closed';
  };

  const handleMonthChange = (direction: 1 | -1) => {
    setCurrentMonth((prev) => (direction === 1 ? addMonths(prev, 1) : subMonths(prev, 1)));
    setSelectedDate(null);
  };

  return (
    <Stack spacing={2.5}>
      {/* Month navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton size="small" onClick={() => handleMonthChange(-1)}>
          <Iconify icon="eva:arrow-ios-back-fill" />
        </IconButton>
        <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
          {format(currentMonth, 'MMMM yyyy', { locale: vi })}
        </Typography>
        <IconButton size="small" onClick={() => handleMonthChange(1)}>
          <Iconify icon="eva:arrow-ios-forward-fill" />
        </IconButton>
      </Box>

      {/* Weekday headers */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', mb: -1 }}>
        {WEEKDAYS.map((d, i) => (
          <Typography
            key={d}
            variant="caption"
            sx={{
              color: i >= 5 ? 'error.light' : 'text.disabled',
              fontWeight: 700,
              py: 0.5,
            }}
          >
            {d}
          </Typography>
        ))}
      </Box>

      {/* Day grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
        {Array.from({ length: calendarData.leadingBlanks }).map((_, i) => (
          <Box key={`blank-${i}`} />
        ))}

        {calendarData.days.map((day) => {
          const status = getDateStatus(day);
          const hasSession = status !== null;
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const today = isToday(day);
          const isWeekend = [0, 6].includes(getDay(day));

          return (
            <Box
              key={day.toISOString()}
              onClick={() => hasSession && setSelectedDate(isSelected ? null : day)}
              sx={{
                position: 'relative',
                aspectRatio: '1 / 1',
                minHeight: 36,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1.5,
                cursor: hasSession ? 'pointer' : 'default',
                transition: 'background-color 0.15s',
                ...(isSelected && { bgcolor: 'primary.main' }),
                ...(today && !isSelected && {
                  bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.16),
                }),
                ...(hasSession && !isSelected && {
                  '&:hover': { bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.08) },
                }),
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: today || isSelected ? 700 : 400,
                  lineHeight: 1,
                  color: isSelected
                    ? 'primary.contrastText'
                    : today
                    ? 'primary.main'
                    : isWeekend
                    ? 'error.light'
                    : 'text.primary',
                }}
              >
                {format(day, 'd')}
              </Typography>

              {hasSession && (
                <Box
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    mt: 0.5,
                    bgcolor: isSelected
                      ? 'primary.contrastText'
                      : status === 'open'
                      ? 'success.main'
                      : 'text.disabled',
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>

      {/* Legend */}
      <Stack direction="row" spacing={2} sx={{ px: 0.5 }}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Còn chỗ
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.disabled' }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Đã đóng
          </Typography>
        </Stack>
      </Stack>

      {/* Sessions for selected date or prompt */}
      {!selectedDate ? (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            Chọn ngày có dấu chấm để xem buổi chơi
          </Typography>
        </Box>
      ) : selectedSessions!.length === 0 ? (
        <EmptyContent title="Không có buổi chơi" sx={{ py: 4 }} />
      ) : (
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
            </Typography>
            <Chip
              label="Xem tất cả"
              size="small"
              variant="outlined"
              onClick={() => setSelectedDate(null)}
            />
          </Box>

          <Stack component={MotionContainer} spacing={2}>
            {selectedSessions!.map((session) => (
              <m.div key={session.id} variants={varFade('inUp', { distance: 16 })}>
                <SessionCard session={session} />
              </m.div>
            ))}
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}
