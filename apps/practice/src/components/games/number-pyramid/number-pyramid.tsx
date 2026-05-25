import { cloneDeep, sumBy } from 'lodash';
import { strategyGameFactory } from '../../game-factory/strategy-game';
import type { Ctx, Events } from '../../game-factory/types';
import {
  aiBotStrategy, generateStartBoard, randomBotStrategy, type Board
} from './strategy';
import { BoardClient, type TurnState } from './board-client';

export const moves = {
  combineTwo: (
    board: Board,
    { ctx, events }: { ctx: Ctx; events: Events },
    { levelIdx, indices }
  ) => {
    const nextBoard = cloneDeep(board);

    const slots = indices.map((idx) => nextBoard.levels[levelIdx][idx]!);
    const combinedValue = sumBy(slots, 'value');
    slots.forEach((slot) => { slot.state = 'consumed'; });

    const emptyIdx = nextBoard.levels[levelIdx + 1].findIndex((s) => s === null);
    nextBoard.levels[levelIdx + 1][emptyIdx] = { value: combinedValue, state: 'active' };

    events.setTurnState(null);
    if (combinedValue >= board.target) {
      events.endGame(ctx.currentPlayer);
      return { nextBoard };
    }
    events.endTurn();
    return { nextBoard };
  }
};

const rule = {
  hu: <>
    A játék kezdetén adott nyolc pozitív egész szám az első szinten, és egy <code>k</code> pozitív
    egész szám, ami nem nagyobb a nyolc szám összegénél. Egy lépésben a soron következő játékos
    letöröl két számot ugyanarról a szintről, és az összegüket az eggyel nagyobb sorszámú szintre
    írja. Az a játékos nyer, aki először ír olyan számot, ami legalább <code>k</code>.
  </>,
  en: <>
    At the start of the game, eight positive integers are given on the first level, along with a
    positive integer <code>k</code> not exceeding their sum. On each turn, the current player
    erases two numbers from the same level and writes their sum onto the next level up. The first
    player to write a number of at least <code>k</code> wins.
  </>
};

const getPlayerStepDescription = ({ ctx }: { ctx: Ctx }) => {
  const turnState = ctx.turnState as TurnState;
  if (turnState) {
    const level = turnState.levelIdx + 1;
    return {
      hu: `Válassz egy másik számot a ${level}. szintről.`,
      en: `Select another number from level ${level}.`
    };
  }
  return {
    hu: 'Válassz két számot ugyanarról a szintről – összegük a következő szintre kerül.',
    en: 'Select two numbers from the same level – their sum moves to the next level up.'
  };
};

export const NumberPyramid = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      label: { hu: 'Teszt 🤖', en: 'Test 🤖' }
    },
    {
      botStrategy: aiBotStrategy,
      generateStartBoard,
      label: { hu: 'Okos 🤖', en: 'Smart 🤖' },
      isDefault: true
    }
  ]
});
