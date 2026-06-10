'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { RANK_OPTIONS } from '@/lib/utils';
import { RegisterSchema, type RegisterInput } from '@/lib/validations';

import { Form, Field } from 'src/components/hook-form';

import type { SessionData, RegistrationResult } from './types';

// ----------------------------------------------------------------------

type Props = {
  session: SessionData;
  onSuccess: (results: RegistrationResult[], waitlistCount: number) => void;
};

export function RegistrationForm({ session, onSuccess }: Props) {
  const [error, setError] = useState<string | null>(null);

  const savedName =
    typeof window !== 'undefined' ? (localStorage.getItem('registrantName') ?? '') : '';
  const savedPhone =
    typeof window !== 'undefined' ? (localStorage.getItem('registrantPhone') ?? '') : '';

  const methods = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      registrantName: savedName,
      registrantPhone: savedPhone,
      courtId: '',
      players: [{ playerName: '', playerGender: 'MALE', playerRank: 'TB' }],
    },
  });

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const { fields, append, remove } = useFieldArray({ control, name: 'players' });

  const onSubmit = handleSubmit(async (data) => {
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${session.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Đăng ký thất bại');
      } else {
        localStorage.setItem('registrantName', data.registrantName);
        localStorage.setItem('registrantPhone', data.registrantPhone);
        onSuccess(
          json.registrations.map((r: RegistrationResult) => ({
            playerName: r.playerName,
            cancelToken: r.cancelToken,
            status: r.status,
          })),
          json.waitlistCount ?? 0
        );
      }
    } catch {
      setError('Lỗi kết nối, thử lại sau');
    }
  });

  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="h6" sx={{ mb: 2.5 }}>
        Đăng ký tham gia
      </Typography>

      <Form methods={methods} onSubmit={onSubmit}>
        <Stack spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            }}
          >
            <Field.Text name="registrantName" label="Tên người đăng ký" placeholder="Nguyễn Văn A" />
            <Field.Text name="registrantPhone" label="Số điện thoại" placeholder="0901234567" />
          </Box>

          <Field.Select name="courtId" label="Chọn sân">
            {session.courts.map((c) => {
              const avail = c.maxSlots - c._count.registrations;
              return (
                <MenuItem key={c.id} value={c.id} disabled={avail <= 0}>
                  {c.name} — còn {avail} chỗ {avail <= 0 ? '(Đầy)' : ''}
                </MenuItem>
              );
            })}
          </Field.Select>

          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2">Người chơi</Typography>
              {fields.length < 4 && (
                <Button
                  size="small"
                  color="primary"
                  onClick={() =>
                    append({ playerName: '', playerGender: 'MALE', playerRank: 'TB' })
                  }
                >
                  + Thêm người
                </Button>
              )}
            </Box>

            {fields.map((field, idx) => (
              <Card key={field.id} variant="outlined" sx={{ p: 2, bgcolor: 'background.neutral' }}>
                <Stack spacing={2}>
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Người {idx + 1}
                    </Typography>
                    {idx > 0 && (
                      <Button size="small" color="error" onClick={() => remove(idx)}>
                        Xóa
                      </Button>
                    )}
                  </Box>

                  <Field.Text
                    name={`players.${idx}.playerName`}
                    label="Họ tên"
                    placeholder="Họ tên"
                    size="small"
                  />

                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
                    <Field.Select name={`players.${idx}.playerGender`} label="Giới tính" size="small">
                      <MenuItem value="MALE">Nam</MenuItem>
                      <MenuItem value="FEMALE">Nữ</MenuItem>
                      <MenuItem value="OTHER">Khác</MenuItem>
                    </Field.Select>
                    <Field.Select name={`players.${idx}.playerRank`} label="Trình độ" size="small">
                      {RANK_OPTIONS.map((r) => (
                        <MenuItem key={r} value={r}>
                          {r}
                        </MenuItem>
                      ))}
                    </Field.Select>
                  </Box>
                </Stack>
              </Card>
            ))}
          </Stack>

          <LoadingButton
            fullWidth
            type="submit"
            size="large"
            variant="contained"
            color="primary"
            loading={isSubmitting}
          >
            Đăng ký tham gia
          </LoadingButton>
        </Stack>
      </Form>
    </Card>
  );
}
