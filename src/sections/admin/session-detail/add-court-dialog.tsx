'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  sessionId: string;
};

export function AddCourtDialog({ open, onClose, sessionId }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  async function addCourt() {
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/admin/sessions/${sessionId}/courts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), maxSlots: 10, warnAt: 8 }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success(`Đã thêm ${name.trim()}`);
      setName('');
      onClose();
      router.refresh();
    } else {
      toast.error('Thêm sân thất bại');
    }
  }

  return (
    <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
      <DialogTitle>Thêm sân mới</DialogTitle>

      <DialogContent>
        <TextField
          fullWidth
          autoFocus
          label="Tên sân"
          placeholder="VD: Sân B"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addCourt();
          }}
          sx={{ mt: 1 }}
        />
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Đóng
        </Button>
        <LoadingButton
          variant="contained"
          color="info"
          loading={saving}
          disabled={!name.trim()}
          onClick={addCourt}
        >
          Thêm sân
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
