'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const LS_KEY = 'spark_mobile_nav';

const NAV_ITEMS = [
  { label: 'Lịch chơi', icon: 'solar:calendar-bold', href: paths.home },
  { label: 'Tra cứu', icon: 'solar:magnifer-bold', href: paths.myRegistrations },
] as const;

// ----------------------------------------------------------------------

export function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [enabled, setEnabled] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(LS_KEY);
    if (stored === 'on') {
      setEnabled(true);
    } else if (stored === 'off') {
      setEnabled(false);
    } else {
      // First visit on mobile — show confirmation dialog
      setEnabled(true);
      setShowDialog(true);
    }
  }, []);

  const handleChoice = (on: boolean) => {
    localStorage.setItem(LS_KEY, on ? 'on' : 'off');
    setEnabled(on);
    setShowDialog(false);
  };

  const activeIndex = NAV_ITEMS.findIndex((item) => item.href === pathname);

  // Only render on mobile, after mount (avoid SSR mismatch)
  if (!mounted || !isMobile) return null;

  return (
    <>
      {/* Fixed bottom nav */}
      {enabled && (
        <BottomNavigation
          value={activeIndex === -1 ? false : activeIndex}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar,
            borderTop: `1px solid ${theme.vars.palette.divider}`,
            bgcolor: 'background.paper',
            backdropFilter: 'blur(6px)',
          }}
        >
          {NAV_ITEMS.map((item) => (
            <BottomNavigationAction
              key={item.href}
              label={item.label}
              icon={<Iconify icon={item.icon} width={22} />}
              onClick={() => router.push(item.href)}
              sx={{
                '&.Mui-selected': { color: 'primary.main' },
                typography: 'caption',
              }}
            />
          ))}
        </BottomNavigation>
      )}

      {/* First-visit confirmation dialog */}
      <Dialog
        open={showDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>Điều hướng di động</DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            {NAV_ITEMS.map((item) => (
              <Box
                key={item.href}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.75,
                  p: 1.5,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Iconify icon={item.icon} width={28} sx={{ color: 'primary.main' }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Bật thanh điều hướng cố định ở cuối màn hình để chuyển trang nhanh hơn.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={() => handleChoice(false)}>
            Tắt
          </Button>
          <Button variant="contained" onClick={() => handleChoice(true)} sx={{ minWidth: 100 }}>
            Bật ngay
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
