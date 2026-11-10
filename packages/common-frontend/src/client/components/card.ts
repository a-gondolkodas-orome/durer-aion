import { alpha, Theme } from '@mui/material/styles';

/// The look of the team pages' cards. An app restyles them with a `card`
/// entry in its theme; what it leaves out is the default below.
export interface CardTokens {
  /// The card's own corners.
  radius: string,
  /// The corners of what sits on a card: its buttons, fields and icon tiles.
  controlRadius: string,
  shadow: string,
  /// A card's running text, a step softer than its headings.
  bodyText: string,
}

declare module '@mui/material/styles' {
  interface Theme {
    card?: Partial<CardTokens>,
  }
  interface ThemeOptions {
    card?: Partial<CardTokens>,
  }
}

const defaultTokens: CardTokens = {
  radius: '16px',
  controlRadius: '12px',
  shadow: '0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.06)',
  bodyText: '#3d4148',
};

export const cardTokens = (theme: Theme): CardTokens => ({ ...defaultTokens, ...theme.card });

/// The card the team's pages put their content on: the login, the disclaimer,
/// the two rounds on the home page and the final score above them.
export const cardSx = (theme: Theme) => ({
  display: 'flex',
  padding: { xs: '20px', md: '32px' },
  borderRadius: cardTokens(theme).radius,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
  boxShadow: cardTokens(theme).shadow,
  backgroundColor: alpha(theme.palette.background.paper, theme.palette.background.paperOpacity),
});

/// The button that moves a team on from a card: starting a round, or past the
/// disclaimer.
export const cardButtonSx = (theme: Theme) => ({
  height: '56px',
  fontSize: '20px',
  fontWeight: 600,
  borderRadius: cardTokens(theme).controlRadius,
  textTransform: 'none',
} as const);
