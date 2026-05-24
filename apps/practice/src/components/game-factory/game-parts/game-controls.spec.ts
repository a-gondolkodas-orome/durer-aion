import { getCtaText } from './game-controls';
import { makeCtx } from '../ctx-factory';

describe('getCtaText', () => {
  describe('vsHuman mode', () => {
    it('roleSelection: returns "Decide who goes first"', () => {
      expect(getCtaText(makeCtx({ phase: 'roleSelection', isHumanVsHumanGame: true })))
        .toEqual({ hu: 'Döntsétek el, hogy ki kezd.', en: 'Decide who goes first.' });
    });

    it('play: returns "Next: [player name]"', () => {
      const ctx = makeCtx({
        phase: 'play', isHumanVsHumanGame: true, currentPlayer: 0, resolvedPlayerNames: ['Alice', 'Bob']
      });
      expect(getCtaText(ctx)).toEqual({ hu: 'Következik: Alice', en: 'Next: Alice' });
    });

    it('gameEnd: returns "Winner: [winner name]"', () => {
      const ctx = makeCtx({
        phase: 'gameEnd', isHumanVsHumanGame: true, winnerIndex: 1, resolvedPlayerNames: ['Alice', 'Bob']
      });
      expect(getCtaText(ctx)).toEqual({ hu: 'A játékot nyerte: Bob', en: 'Winner: Bob' });
    });
  });

  describe('vsComputer mode', () => {
    it('roleSelection: returns "Choose a role"', () => {
      expect(getCtaText(makeCtx({ phase: 'roleSelection' })))
        .toEqual({ hu: 'Válassz szerepet!', en: 'Choose a role!' });
    });

    it('play: returns "Your turn" when client move is allowed', () => {
      expect(getCtaText(makeCtx({ phase: 'play', isClientMoveAllowed: true })))
        .toEqual({ hu: 'Te jössz', en: 'Your turn' });
    });

    it("play: returns \"Computer's turn\" when client move is not allowed", () => {
      expect(getCtaText(makeCtx({ phase: 'play' })))
        .toEqual({ hu: 'Mi jövünk', en: "Computer's turn" });
    });

    it('gameEnd: returns win message when role selector won', () => {
      expect(getCtaText(makeCtx({ phase: 'gameEnd', winnerIndex: 0, chosenRoleIndex: 0 })))
        .toEqual({ hu: 'Nyertél. Gratulálunk! :)', en: 'You won. Congratulations! :)' });
    });

    it('gameEnd: returns lose message when role selector did not win', () => {
      expect(getCtaText(makeCtx({ phase: 'gameEnd', winnerIndex: 1, chosenRoleIndex: 0 })))
        .toEqual({
          hu: 'Sajnos, most nem nyertél, de ne add fel.',
          en: "Unfortunately you didn't win this time, but don't give up."
        });
    });
  });
});
