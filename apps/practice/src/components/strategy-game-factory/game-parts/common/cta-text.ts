import type { I18nString } from '../../../../language';
import type { Ctx } from '../../types';

export const getCtaText = ({
  phase,
  isHumanVsHumanGame,
  isClientMoveAllowed,
  currentPlayer,
  winnerIndex,
  chosenRoleIndex,
  resolvedPlayerNames
}: Ctx): I18nString => {
  if (phase === 'roleSelection') {
    return isHumanVsHumanGame
      ? { hu: 'Döntsétek el, hogy ki kezd.', en: 'Decide who goes first.' }
      : { hu: 'Válassz szerepet!', en: 'Choose a role!' };
  }
  if (phase === 'play') {
    return isHumanVsHumanGame
      ? { hu: `Következik: ${resolvedPlayerNames[currentPlayer!]}`, en: `Next: ${resolvedPlayerNames[currentPlayer!]}` }
      : isClientMoveAllowed
        ? { hu: 'Te jössz', en: 'Your turn' }
        : { hu: 'Mi jövünk', en: "Computer's turn" };
  }
  else {
    return isHumanVsHumanGame
      ? { hu: `A játékot nyerte: ${resolvedPlayerNames[winnerIndex!]}`,
          en: `Winner: ${resolvedPlayerNames[winnerIndex!]}` }
      : winnerIndex === chosenRoleIndex
        ? { hu: 'Nyertél. Gratulálunk! :)', en: 'You won. Congratulations! :)' }
        : {
          hu: 'Sajnos, most nem nyertél, de ne add fel.',
          en: "Unfortunately you didn't win this time, but don't give up."
        };
  }
};
