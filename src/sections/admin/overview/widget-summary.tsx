import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { varAlpha } from 'minimal-shared/utils';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  title: string;
  total: string | number;
  icon: string;
  color?: 'primary' | 'info' | 'warning' | 'error' | 'success';
};

export function WidgetSummary({ title, total, icon, color = 'primary' }: Props) {
  return (
    <Card sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box
        sx={(theme) => ({
          width: 48,
          height: 48,
          flexShrink: 0,
          display: 'flex',
          borderRadius: 1.5,
          alignItems: 'center',
          justifyContent: 'center',
          color: `${color}.main`,
          bgcolor: varAlpha(theme.vars.palette[color].mainChannel, 0.08),
        })}
      >
        <Iconify width={28} icon={icon} />
      </Box>

      <Box>
        <Typography variant="h4">{total}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {title}
        </Typography>
      </Box>
    </Card>
  );
}
