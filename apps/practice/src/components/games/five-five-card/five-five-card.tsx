import { range, cloneDeep } from 'lodash';
import { strategyGameFactory, type Ctx, type Events, type BoardClientProps, GameBoard } from '../../game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { useTranslation } from '../../language';

export type Board = (number | null)[][]

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const isMoveAllowed = (id: number) => {
    if (!ctx.isClientMoveAllowed) return false;
    return board[1 - ctx.currentPlayer!][id] !== null;
  };
  const clickField = (id: number) => {
    if (!isMoveAllowed(id)) return;

    moves.removeCard(board, id + 1);
  };

  return (
  <GameBoard>
    <div className="grid grid-cols-4 gap-y-3">
      <h2 className="text-center col-start-1">
        {t({ hu: 'Kezdő', en: 'First' })}
      </h2>
      <h2 className="text-center col-start-4">
        {t({ hu: 'Második', en: 'Second' })}
      </h2>

      {range(5).map(id => (
        [0, 1].map(playerIdx => (
          <button
            key={`${playerIdx}-${id}`}
            disabled={playerIdx === ctx.currentPlayer || !isMoveAllowed(id)}
            onClick={() => clickField(id)}
            className={`
              ${playerIdx === 0 ? 'col-start-1' : 'col-start-4'}
              aspect-3/2 text-2xl border-4 rounded-lg
              enabled:border-green-400 enabled:border-dashed
              enabled:hocus:border-solid
              ${board[playerIdx][id] === null ? 'opacity-0' : ''}
            `}
          >
            {board[playerIdx][id]}
          </button>
        ))
      ))}
    </div>
  </GameBoard>
  );
};

const isGameEnd = (board: Board) => {
  return (
    board[0].filter(v => v !== null).length === 1 &&
    board[1].filter(v => v !== null).length === 1
  );
};

export const getWinnerIndex = (board: Board) => {
  if (!isGameEnd(board)) return undefined;
  const firstPlayerNumber = board[0].find(v => v !== null)!;
  const secondPlayerNumber = board[1].find(v => v !== null)!

  if (firstPlayerNumber === secondPlayerNumber) return 0;
  if ((firstPlayerNumber + secondPlayerNumber) % 2 === 0){
    return firstPlayerNumber < secondPlayerNumber ? 0 : 1;
  } else {
    return firstPlayerNumber > secondPlayerNumber ? 0 : 1;
  }
}

const moves = {
  removeCard: (board: Board, { ctx, events }: { ctx: Ctx, events: Events }, id: number) => {
    const nextBoard = cloneDeep(board);
    nextBoard[1 - ctx.currentPlayer!][id - 1] = null;
    events.endTurn();
    if (isGameEnd(nextBoard)) {
      events.endGame(getWinnerIndex(nextBoard));
    }
    return { nextBoard };
  }
}

const rule = {
  hu: <>
    Mindkét játékos előtt 5-5 kártyalap van az 1-5 egész számokkal megszámozva.
    A játékosok felváltva elvesznek egy-egy lapot az ellenfelük elől, egészen addig, amíg
    már csak egy-egy lap marad előttük. Ha a két megmaradt
    szám összege páratlan, akkor az nyer, aki előtt a nagyobbik van; ha páros az összeg, akkor
    pedig az, aki előtt a kisebbik (ha ugyanaz a szám marad meg a két játékos előtt, akkor az nyer,
    aki kezdte a játékot).
  </>,
  en: <>
    Each player has 5 cards in front of them numbered 1 to 5. The players take turns removing one
    card from their opponent's row until only one card remains in front of each player. If the sum
    of the two remaining numbers is odd, the player with the larger number wins; if the sum is even,
    the player with the smaller number wins (if both players have the same number left, the first
    player wins).
  </>
};

export const FiveFiveCard = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Vegyél el egy kártyát az ellenfél elől.',
      en: 'Remove a card from your opponent.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt 🤖', en: 'Test 🤖' } },
    {
      // smart bot: verified as optimal
      botStrategy: smartBotStrategy,
      generateStartBoard: () => [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5]],
      label: { hu: 'Okos 🤖', en: 'Smart 🤖' },
      isDefault: true
    }
  ]
});
