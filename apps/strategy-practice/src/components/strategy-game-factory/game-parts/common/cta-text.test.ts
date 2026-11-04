import i18next from 'i18next';
import { getCtaText } from './cta-text';
import { makeCtx } from 'test-utils';

const t = i18next.getFixedT('hu', 'factory');

describe('getCtaText', () => {
  describe('vsHuman mode', () => {
    it('roleSelection: returns "Decide who goes first"', () => {
      expect(getCtaText(makeCtx({ phase: 'roleSelection', isHumanVsHumanGame: true }), t))
        .toEqual('Döntsétek el, hogy ki kezd.');
    });

    it('play: returns "Next: [player name]"', () => {
      const ctx = makeCtx({
        phase: 'play', isHumanVsHumanGame: true, currentPlayer: 0, resolvedPlayerNames: ['Alice', 'Bob']
      });
      expect(getCtaText(ctx, t)).toEqual('Következik: Alice');
    });

    it('gameEnd: returns "Winner: [winner name]"', () => {
      const ctx = makeCtx({
        phase: 'gameEnd', isHumanVsHumanGame: true, winnerIndex: 1, resolvedPlayerNames: ['Alice', 'Bob']
      });
      expect(getCtaText(ctx, t)).toEqual('A játékot nyerte: Bob');
    });
  });

  describe('vsComputer mode', () => {
    it('roleSelection: returns "Choose a role"', () => {
      expect(getCtaText(makeCtx({ phase: 'roleSelection' }), t))
        .toEqual('Válassz szerepet!');
    });

    it('play: returns "Your turn" when client move is allowed', () => {
      expect(getCtaText(makeCtx({ phase: 'play', isClientMoveAllowed: true }), t))
        .toEqual('Te jössz');
    });

    it("play: returns \"Computer's turn\" when client move is not allowed", () => {
      expect(getCtaText(makeCtx({ phase: 'play' }), t))
        .toEqual('Mi jövünk');
    });

    it('gameEnd: returns win message when role selector won', () => {
      expect(getCtaText(makeCtx({ phase: 'gameEnd', winnerIndex: 0, chosenRoleIndex: 0 }), t))
        .toEqual('Nyertél. Gratulálunk! :)');
    });

    it('gameEnd: returns lose message when role selector did not win', () => {
      expect(getCtaText(makeCtx({ phase: 'gameEnd', winnerIndex: 1, chosenRoleIndex: 0 }), t))
        .toEqual('Sajnos, most nem nyertél, de ne add fel.');
    });
  });
});
