import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { varAlpha } from 'minimal-shared/utils';

import type { CourtData } from './types';

// ----------------------------------------------------------------------

type Props = {
  court: Pick<CourtData, 'maxSlots' | 'registrations'>;
  columns?: number;
};

export function CourtSlotGrid({ court, columns = 5 }: Props) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 0.75,
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      }}
    >
      {Array.from({ length: court.maxSlots }).map((_, i) => {
        const reg = court.registrations[i];
        const isFemale = reg?.playerGender === 'FEMALE';

        return (
          <Tooltip key={i} title={reg ? `${reg.playerName} (${reg.playerRank})` : 'Trống'}>
            <Box
              sx={(theme) => ({
                aspectRatio: '1 / 1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
                typography: 'caption',
                fontWeight: 'fontWeightMedium',
                ...(reg
                  ? {
                      color: isFemale ? 'error.dark' : 'info.dark',
                      border: `1px solid ${varAlpha(
                        isFemale
                          ? theme.vars.palette.error.mainChannel
                          : theme.vars.palette.info.mainChannel,
                        0.24
                      )}`,
                      bgcolor: varAlpha(
                        isFemale
                          ? theme.vars.palette.error.mainChannel
                          : theme.vars.palette.info.mainChannel,
                        0.12
                      ),
                      ...theme.applyStyles('dark', {
                        color: isFemale ? 'var(--palette-error-light)' : 'var(--palette-info-light)',
                      }),
                    }
                  : {
                      color: 'text.disabled',
                      border: `1px solid ${theme.vars.palette.divider}`,
                      bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
                    }),
              })}
            >
              {reg ? reg.playerRank : i + 1}
            </Box>
          </Tooltip>
        );
      })}
    </Box>
  );
}
