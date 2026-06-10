import type { Breakpoint } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

export type FooterProps = {
  sx?: SxProps<Theme>;
  layoutQuery?: Breakpoint;
};

export function Footer({ sx }: FooterProps) {
  return (
    <Box
      component="footer"
      sx={[{ py: 3, textAlign: 'center' }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <Container>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          🏸 {CONFIG.appName} · © {new Date().getFullYear()}
        </Typography>
      </Container>
    </Box>
  );
}

export function HomeFooter({ sx }: FooterProps) {
  return <Footer sx={sx} />;
}
