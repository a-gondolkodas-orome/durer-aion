import { range } from 'lodash';
import { strategyGameFactory, type BoardClientProps, GameBoard } from 'strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { useTranslation } from 'language';
import { moves, type Board } from './gameplay';

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();

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
            disabled={playerIdx === ctx.currentPlayer || !moves.removeCard.isAllowed(board, id + 1)}
            onClick={() => moves.removeCard(board, id + 1)}
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

const rule = {
  hu: <>
    Mindkét játékos előtt 5-5 kártyalap van az 1-5 egész számokkal megszámozva.
    A játékosok felváltva elvesznek egy-egy lapot a másik játékos elől, egészen addig, amíg
    már csak egy-egy lap marad előttük. Ha a két megmaradt
    szám összege páratlan, akkor az nyer, aki előtt a nagyobbik van; ha páros az összeg, akkor
    pedig az, aki előtt a kisebbik (ha ugyanaz a szám marad meg a két játékos előtt, akkor az nyer,
    aki kezdte a játékot).
  </>,
  en: <>
    Each player has 5 cards in front of them numbered 1 to 5. The players take turns removing one
    card from the other player's row until only one card remains in front of each player. If the sum
    of the two remaining numbers is odd, the player with the larger number wins; if the sum is even,
    the player with the smaller number wins (if both players have the same number left, the first
    player wins).
  </>
};

export const FiveFiveCard = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Vegyél el egy kártyát a másik játékos elől.',
      en: 'Remove a card from the other player.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt', en: 'Test' } },
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: () => [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5]],
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
