'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { paths } from 'src/routes/paths';

import { SessionSchema, type SessionInput } from '@/lib/validations';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export function SessionCreateDialog() {
  const router = useRouter();
  const open = useBoolean();

  const methods = useForm<SessionInput>({
    resolver: zodResolver(SessionSchema),
    defaultValues: { isRecurring: false },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        courts: [{ name: 'Sân A', maxSlots: 10, warnAt: 8 }],
      }),
    });
    if (res.ok) {
      const session = await res.json();
      reset();
      open.onFalse();
      router.push(paths.admin.session(session.id));
      router.refresh();
    } else {
      toast.error('Tạo buổi chơi thất bại');
    }
  });

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<Iconify icon="mingcute:add-line" />}
        onClick={open.onTrue}
      >
        Tạo buổi chơi
      </Button>

      <Dialog fullWidth maxWidth="xs" open={open.value} onClose={open.onFalse}>
        <DialogTitle>Tạo buổi chơi mới</DialogTitle>

        <Form methods={methods} onSubmit={onSubmit}>
          <DialogContent>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <Field.Text name="title" label="Tên buổi chơi" placeholder="Cầu lông T4 tuần này" />

              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
                <Field.Text
                  name="date"
                  label="Ngày"
                  type="date"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <Field.Text name="location" label="Địa điểm" placeholder="Sân Thăng Long" />
              </Box>

              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
                <Field.Text
                  name="startTime"
                  label="Giờ bắt đầu"
                  type="time"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <Field.Text
                  name="endTime"
                  label="Giờ kết thúc"
                  type="time"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Box>

              <Field.Switch name="isRecurring" label="Lịch cố định" />

              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                * Mặc định tạo 1 sân. Có thể thêm sân sau khi tạo.
              </Typography>
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button variant="outlined" color="inherit" onClick={open.onFalse}>
              Đóng
            </Button>
            <LoadingButton type="submit" variant="contained" color="primary" loading={isSubmitting}>
              Tạo buổi chơi
            </LoadingButton>
          </DialogActions>
        </Form>
      </Dialog>
    </>
  );
}
