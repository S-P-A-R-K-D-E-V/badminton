'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

// ----------------------------------------------------------------------

type Props = {
  sessionId: string;
  status: string;
  onAddCourt: () => void;
  onToggleCost: () => void;
};

export function SessionStatusToolbar({ sessionId, status, onAddCourt, onToggleCost }: Props) {
  const router = useRouter();
  const confirmDuplicate = useBoolean();
  const [loading, setLoading] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  async function changeStatus(next: string | null) {
    if (!next || next === status) return;
    setLoading(true);
    await fetch(`/api/sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    router.refresh();
    setLoading(false);
  }

  async function duplicateSession() {
    setDuplicating(true);
    const res = await fetch(`/api/admin/sessions/${sessionId}/duplicate`, { method: 'POST' });
    setDuplicating(false);
    confirmDuplicate.onFalse();
    if (res.ok) {
      const newSession = await res.json();
      toast.success('Đã nhân đôi buổi chơi');
      router.push(paths.admin.session(newSession.id));
    } else {
      toast.error('Lỗi khi nhân đôi buổi chơi');
    }
  }

  return (
    <Card sx={{ p: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography variant="subtitle2">Trạng thái:</Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={status}
          disabled={loading}
          onChange={(_, value) => changeStatus(value)}
        >
          <ToggleButton value="OPEN" color="success">
            Đang mở
          </ToggleButton>
          <ToggleButton value="CLOSED" color="standard">
            Đóng
          </ToggleButton>
          <ToggleButton value="CANCELLED" color="error">
            Hủy buổi
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ ml: 'auto', display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          target="_blank"
          href={paths.session(sessionId)}
          startIcon={<Iconify icon="solar:eye-bold" />}
        >
          Xem member
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="secondary"
          disabled={duplicating}
          onClick={confirmDuplicate.onTrue}
          startIcon={<Iconify icon="solar:copy-bold" />}
        >
          Nhân đôi
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="warning"
          onClick={onToggleCost}
          startIcon={<Iconify icon="solar:wallet-money-bold" />}
        >
          Chi phí
        </Button>
        <Button
          size="small"
          variant="contained"
          color="info"
          onClick={onAddCourt}
          startIcon={<Iconify icon="mingcute:add-line" />}
        >
          Sân
        </Button>
      </Box>

      <ConfirmDialog
        open={confirmDuplicate.value}
        onClose={confirmDuplicate.onFalse}
        title="Nhân đôi buổi chơi"
        content="Nhân đôi buổi chơi này sang tuần sau (+7 ngày)?"
        action={
          <Button variant="contained" disabled={duplicating} onClick={duplicateSession}>
            Nhân đôi
          </Button>
        }
      />
    </Card>
  );
}
