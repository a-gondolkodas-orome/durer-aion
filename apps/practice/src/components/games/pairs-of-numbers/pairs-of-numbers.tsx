import { strategyGameFactory, type BoardClientProps, GameBoard } from 'strategy-game-factory';
import { useTranslation } from 'language';
import { generateStartBoard, generateTestStartBoard, moves, type Board } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  return(
    <GameBoard>
      <p className='text-4xl font-bold text-center mb-2'>
        <code>({board[0]},{board[1]})</code>
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          className="primary-button w-auto grow"
          disabled={!ctx.isClientMoveAllowed}
          onClick={() => moves.add1(board)}
        >
          {t({ hu: 'Növelek', en: 'Increase' })} {ctx.isClientMoveAllowed && <>
            (→<code>({board[0]},{board[1] + 1})</code>)
          </>}
        </button>
        <button
          className="primary-button w-auto grow"
          disabled={!ctx.isClientMoveAllowed}
          onClick={() => moves.subtract(board)}
        >
          {t({ hu: 'Kivonok', en: 'Subtract' })} {ctx.isClientMoveAllowed && <>
            (→<code>({board[0] - board[1]},{board[1]})</code>)
          </>}
        </button>
      </div>
    </GameBoard>
  );
};

const rule = {
  hu: <>
    Adott egy pozitív egészekből álló <code>(n,&nbsp;k)</code> rendezett számpár.
    Két játékos felváltva lép, az <code>(a,&nbsp;b)</code> számpár
    helyére egy lépésben kerülhet vagy az <code className="whitespace-nowrap">(a, b + 1)</code>,
    vagy az <code className="whitespace-nowrap">(a − b, b)</code> számpár.
    Az nyer, aki először ír fel olyan számpárt, amelyben nem mindkét szám pozitív.
  </>,
  en: <>
    Initially, an ordered pair of positive integers <code>(n,&nbsp;k)</code> is written on a sheet of paper.
    Two players take turns. In each turn, if the pair
    <code>(a,&nbsp;b)</code> is on the sheet and is not crossed out, then the player
    must cross out <code>(a,&nbsp;b)</code> and instead write
    <code className="whitespace-nowrap">(a, b + 1)</code> or
    <code className="whitespace-nowrap">(a − b, b)</code> on the sheet.
    The winner is the first player to write a pair in which at least one of the numbers is not positive.
  </>
};

export const PairsOfNumbers = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Növeld a második számot eggyel vagy vond ki az elsőből.',
      en: 'Increase the second number by 1 or subtract it from the first.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      generateStartBoard: generateTestStartBoard,
      label: { hu: 'Teszt', en: 'Test' }
    },
    {
      botStrategy: smartBotStrategy,
      generateStartBoard,
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
