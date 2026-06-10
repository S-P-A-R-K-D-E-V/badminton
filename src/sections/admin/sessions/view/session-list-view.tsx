'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { formatDate, formatTime } from '@/lib/utils';

import { toast } from 'src/components/snackbar';
import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import {
  useTable,
  TableNoData,
  TableHeadCustom,
  TableSelectedAction,
} from 'src/components/table';

import { SessionCreateDialog } from '../session-create-dialog';

// ----------------------------------------------------------------------

type SessionRow = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  location: string;
  status: string;
  courts: {
    id: string;
    maxSlots: number;
    _count: { registrations: number };
  }[];
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Đang mở',
  CLOSED: 'Đã đóng',
  CANCELLED: 'Đã hủy',
};

const STATUS_COLOR: Record<string, 'success' | 'default' | 'error'> = {
  OPEN: 'success',
  CLOSED: 'default',
  CANCELLED: 'error',
};

const HEAD_CELLS = [
  { id: 'title', label: 'Buổi chơi' },
  { id: 'date', label: 'Thời gian' },
  { id: 'location', label: 'Địa điểm' },
  { id: 'slots', label: 'Đăng ký', align: 'center' as const },
  { id: 'status', label: 'Trạng thái' },
];

type Props = {
  sessions: SessionRow[];
};

export function SessionListView({ sessions }: Props) {
  const router = useRouter();
  const table = useTable();

  const confirmClose = useBoolean();
  const confirmCancel = useBoolean();
  const [bulkLoading, setBulkLoading] = useState(false);

  const notFound = sessions.length === 0;

  async function bulkUpdate(status: 'CLOSED' | 'CANCELLED') {
    setBulkLoading(true);
    const res = await fetch('/api/admin/sessions/bulk-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: table.selected, status }),
    });
    setBulkLoading(false);
    if (res.ok) {
      toast.success(status === 'CLOSED' ? 'Đã đóng các buổi chơi' : 'Đã hủy các buổi chơi');
      table.onSelectAllRows(false, []);
      confirmClose.onFalse();
      confirmCancel.onFalse();
      router.refresh();
    } else {
      toast.error('Có lỗi xảy ra');
    }
  }

  return (
    <Container maxWidth="lg">
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}
      >
        <Typography variant="h4">Quản lý buổi chơi</Typography>
        <SessionCreateDialog />
      </Box>

      <Card>
        <Box sx={{ position: 'relative' }}>
          <TableSelectedAction
            numSelected={table.selected.length}
            rowCount={sessions.length}
            onSelectAllRows={(checked) =>
              table.onSelectAllRows(
                checked,
                sessions.map((row) => row.id)
              )
            }
            action={
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Đóng đăng ký">
                  <IconButton color="default" onClick={confirmClose.onTrue}>
                    <Iconify icon="solar:lock-bold" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Hủy buổi chơi">
                  <IconButton color="error" onClick={confirmCancel.onTrue}>
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Tooltip>
              </Box>
            }
          />

          <Scrollbar>
            <Table sx={{ minWidth: 720 }}>
              <TableHeadCustom
                headCells={HEAD_CELLS}
                rowCount={sessions.length}
                numSelected={table.selected.length}
                onSelectAllRows={(checked) =>
                  table.onSelectAllRows(
                    checked,
                    sessions.map((row) => row.id)
                  )
                }
              />

              <TableBody>
                {sessions.map((row) => {
                  const totalBooked = row.courts.reduce(
                    (sum, c) => sum + c._count.registrations,
                    0
                  );
                  const totalSlots = row.courts.reduce((sum, c) => sum + c.maxSlots, 0);
                  const selected = table.selected.includes(row.id);

                  return (
                    <TableRow
                      key={row.id}
                      hover
                      selected={selected}
                      onClick={() => router.push(paths.admin.session(row.id))}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected}
                          onChange={() => table.onSelectRow(row.id)}
                          inputProps={{ 'aria-label': `Chọn ${row.title}` }}
                        />
                      </TableCell>

                      <TableCell>
                        <Typography variant="subtitle2">{row.title}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {row.courts.length} sân
                        </Typography>
                      </TableCell>

                      <TableCell>
                        {formatDate(row.date)}
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                          {formatTime(row.startTime)}
                        </Typography>
                      </TableCell>

                      <TableCell>{row.location}</TableCell>

                      <TableCell align="center">
                        {totalBooked}/{totalSlots}
                      </TableCell>

                      <TableCell>
                        <Label variant="soft" color={STATUS_COLOR[row.status] ?? 'default'}>
                          {STATUS_LABEL[row.status] ?? row.status}
                        </Label>
                      </TableCell>
                    </TableRow>
                  );
                })}

                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>
      </Card>

      <ConfirmDialog
        open={confirmClose.value}
        onClose={confirmClose.onFalse}
        title="Đóng đăng ký"
        content={`Đóng đăng ký ${table.selected.length} buổi chơi đã chọn?`}
        action={
          <Button variant="contained" disabled={bulkLoading} onClick={() => bulkUpdate('CLOSED')}>
            Đóng đăng ký
          </Button>
        }
      />

      <ConfirmDialog
        open={confirmCancel.value}
        onClose={confirmCancel.onFalse}
        title="Hủy buổi chơi"
        content={`Hủy ${table.selected.length} buổi chơi đã chọn? Người chơi sẽ không đăng ký được nữa.`}
        action={
          <Button
            variant="contained"
            color="error"
            disabled={bulkLoading}
            onClick={() => bulkUpdate('CANCELLED')}
          >
            Hủy buổi chơi
          </Button>
        }
      />
    </Container>
  );
}
