'use client';

import { z } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const PinSchema = z.object({
  pin: z.string().length(6, 'Nhập đủ 6 số'),
});

type PinInput = z.infer<typeof PinSchema>;

export function AdminPinView() {
  const router = useRouter();
  const [error, setError] = useState('');

  const methods = useForm<PinInput>({
    resolver: zodResolver(PinSchema),
    defaultValues: { pin: '' },
  });

  const {
    setValue,
    setFocus,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async ({ pin }) => {
    setError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    if (res.ok) {
      router.push(paths.admin.root);
    } else {
      setError('PIN không đúng');
      setValue('pin', '');
      setFocus('pin');
    }
  });

  return (
    <Stack spacing={3} sx={{ textAlign: 'center' }}>
      <Typography variant="h2" component="div">
        🔐
      </Typography>

      <Stack spacing={0.5}>
        <Typography variant="h5">Admin</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Nhập PIN 6 số
        </Typography>
      </Stack>

      <Form methods={methods} onSubmit={onSubmit}>
        <Field.Code
          name="pin"
          validateChar={(char) => /^\d$/.test(char)}
          onComplete={() => onSubmit()}
          slotProps={{ textfield: { type: 'password', disabled: isSubmitting } }}
        />
      </Form>

      {error && <Alert severity="error">{error}</Alert>}

      {isSubmitting && (
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress size={16} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Đang xác thực...
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}
