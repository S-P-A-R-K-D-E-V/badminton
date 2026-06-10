'use client';

import type { IconButtonProps } from '@mui/material/IconButton';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function LogoutButton({ sx, ...other }: IconButtonProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/admin/login', { method: 'DELETE' });
      router.push(paths.admin.login);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title="Đăng xuất">
      <IconButton onClick={handleLogout} disabled={loading} sx={sx} {...other}>
        <Iconify icon="solar:logout-2-bold" />
      </IconButton>
    </Tooltip>
  );
}
