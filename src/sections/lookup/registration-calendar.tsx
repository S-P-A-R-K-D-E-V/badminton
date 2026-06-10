'use client';

import { useState, useMemo } from 'react';
import { isFuture, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, getDay, format } from 'date-fns';
import { vi } from 'date-fns/locale';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import { varAlpha } from 'minimal-shared/utils';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

type RegItem = {
  id: string;
  session: {
    date: string;
    status: string;
  };
};

type Props = {
  registrations: RegItem[];
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
};

export function RegistrationCalendar({ registrations, selectedDate, onSelectDate }: Props) {
  const theme = useTheme();

  const initialMonth = useMemo(() => {
    const sorted = [...registrations].sort(
      (a, b) => new Date(a.session.date).getTime() - new Date(b.session.date).getTime()
    );
    const future = sorted.find((r) => isFuture(new Date(r.session.date)));
    if (future) return new Date(future.session.date);
    if (sorted.length > 0) return new Date(sorted[sorted.length - 1].session.date);
    return new Date();
  }, [registrations]);

  const [currentMonth, setCurrentMonth] = useState(initialMonth);

  const regsByDate = useMemo(() => {
    const map = new Map<string, RegItem[]>();
    registrations.forEach((r) => {
      const key = format(new Date(r.session.date), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return map;
  }, [registrations]);

  const calendarData = useMemo(() => {
    const firstDay = startOfMonth(currentMonth);
    const lastDay = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: firstDay, end: lastDay });
    const leadingBlanks = (getDay(firstDay) + 6) % 7;
    return { days, leadingBlanks };
  }, [currentMonth]);

  const handleMonthChange = (direction: 1 | -1) => {
    setCurrentMonth((prev) => (direction === 1 ? addMonths(prev, 1) : subMonths(prev, 1)));
    onSelectDate(null);
  };

  const totalInMonth = useMemo(() => {
    const monthStr = format(currentMonth, 'yyyy-MM');
    return registrations.filter((r) => r.session.date.startsWith(monthStr)).length;
  }, [currentMonth, registrations]);

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        p: 2,
        bgcolor: 'background.neutral',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <IconButton size="small" onClick={() => handleMonthChange(-1)}>
          <Iconify icon="eva:arrow-ios-back-fill" width={16} />
        </IconButton>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="subtitle2" sx={{ textTransform: 'capitalize', lineHeight: 1.2 }}>
            {format(currentMonth, 'MMMM yyyy', { locale: vi })}
          </Typography>
          {totalInMonth > 0 && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {totalInMonth} đăng ký
            </Typography>
          )}
        </Box>

        <IconButton size="small" onClick={() => handleMonthChange(1)}>
          <Iconify icon="eva:arrow-ios-forward-fill" width={16} />
        </IconButton>
      </Box>

      {/* Weekday headers */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center' }}>
        {WEEKDAYS.map((d, i) => (
          <Typography
            key={d}
            variant="caption"
            sx={{
              color: i >= 5 ? 'error.light' : 'text.disabled',
              fontWeight: 700,
              fontSize: 10,
              py: 0.25,
            }}
          >
            {d}
          </Typography>
        ))}
      </Box>

      {/* Day grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.25, mt: 0.25 }}>
        {Array.from({ length: calendarData.leadingBlanks }).map((_, i) => (
          <Box key={`blank-${i}`} />
        ))}

        {calendarData.days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayRegs = regsByDate.get(key);
          const hasReg = !!dayRegs;
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const today = isToday(day);
          const hasFuture =
            hasReg &&
            dayRegs!.some(
              (r) => isFuture(new Date(r.session.date)) && r.session.status !== 'CANCELLED'
            );
          const isWeekend = [0, 6].includes(getDay(day));

          return (
            <Box
              key={day.toISOString()}
              onClick={() => hasReg && onSelectDate(isSelected ? null : day)}
              sx={{
                aspectRatio: '1 / 1',
                minHeight: 32,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
                cursor: hasReg ? 'pointer' : 'default',
                transition: 'background-color 0.15s',
                ...(isSelected && { bgcolor: 'primary.main' }),
                ...(today && !isSelected && {
                  bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.12),
                }),
                ...(hasReg && !isSelected && {
                  '&:hover': { bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.08) },
                }),
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: 11,
                  lineHeight: 1,
                  fontWeight: today || isSelected ? 700 : 400,
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

              {hasReg && (
                <Box
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    mt: 0.25,
                    bgcolor: isSelected
                      ? 'primary.contrastText'
                      : hasFuture
                      ? 'info.main'
                      : 'text.disabled',
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>

      {/* Footer: legend + clear */}
      <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1.5}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'info.main' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10 }}>
              Sắp tới
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.disabled' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10 }}>
              Đã qua
            </Typography>
          </Stack>
        </Stack>

        {selectedDate && (
          <Chip
            label="Tất cả"
            size="small"
            variant="outlined"
            onClick={() => onSelectDate(null)}
            sx={{ height: 20, fontSize: 10, cursor: 'pointer' }}
          />
        )}
      </Box>
    </Box>
  );
}
