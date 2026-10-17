import type { TFunction } from 'i18next';
import type { Ctx } from 'strategy-engine';

export const getCtaText = ({
  phase,
  isHumanVsHumanGame,
  isClientMoveAllowed,
  currentPlayer,
  winnerIndex,
  chosenRoleIndex,
  resolvedPlayerNames
}: Ctx, t: TFunction<'factory'>): string => {
  if (phase === 'roleSelection') {
    return isHumanVsHumanGame ? t('cta.decideWhoStarts') : t('cta.chooseRole');
  }
  if (phase === 'play') {
    return isHumanVsHumanGame
      ? t('cta.next', { name: resolvedPlayerNames[currentPlayer!] })
      : isClientMoveAllowed ? t('cta.yourTurn') : t('cta.computersTurn');
  }
  else {
    return isHumanVsHumanGame
      ? t('cta.winner', { name: resolvedPlayerNames[winnerIndex!] })
      : winnerIndex === chosenRoleIndex ? t('cta.youWon') : t('cta.youLost');
  }
};
