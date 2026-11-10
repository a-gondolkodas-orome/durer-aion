import { alpha, Theme } from '@mui/material/styles';

/// The card the team's pages put their content on: the login, the disclaimer,
/// the two rounds on the home page and the final score above them.
export const cardSx = (theme: Theme) => ({
  display: 'flex',
  padding: { xs: '20px', md: '32px' },
  borderRadius: '16px',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.06)',
  backgroundColor: alpha(theme.palette.background.paper, theme.palette.background.paperOpacity),
});

/// The button that moves a team on from a card: starting a round, or past the
/// disclaimer.
export const cardButtonSx = {
  height: '56px',
  fontSize: '20px',
  fontWeight: 600,
  borderRadius: '12px',
  textTransform: 'none',
} as const;
