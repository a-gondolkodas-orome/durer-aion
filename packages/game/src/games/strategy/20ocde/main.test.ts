import { GUESSER_PLAYER, JUDGE_PLAYER } from '../../../common/types';
import type { GameStateMixin } from '../../../common/types';
import type { MyGameState } from './game';
import { getPlayerStepDescription } from './main';

// Category E: the first player plays O, one at a time; the second X, two at a time.
const G = { category: 'E', firstPlayer: GUESSER_PLAYER } as unknown as MyGameState & GameStateMixin;

describe('the 5×5 game\'s step description', () => {
  test('asks for a circle from the side playing O', () => {
    expect(getPlayerStepDescription({ G, ctx: { currentPlayer: GUESSER_PLAYER }, playerID: GUESSER_PLAYER, turnState: null }))
      .toBe('Tegyetek egy kört egy üres mezőre!');
  });

  test('asks for the first X, then the second once the board reports one picked', () => {
    const asX = { G: { ...G, firstPlayer: JUDGE_PLAYER }, ctx: { currentPlayer: GUESSER_PLAYER }, playerID: GUESSER_PLAYER };
    expect(getPlayerStepDescription({ ...asX, turnState: { xsPlaced: 0 } })).toBe('Jelöljétek ki az első X helyét!');
    expect(getPlayerStepDescription({ ...asX, turnState: { xsPlaced: 1 } })).toMatch(/^Válasszátok ki a második X helyét!/);
  });
});
