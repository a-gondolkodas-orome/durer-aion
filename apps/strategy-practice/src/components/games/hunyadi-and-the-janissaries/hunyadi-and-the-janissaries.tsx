import {
  strategyGameFactory, type BoardClientProps, type Ctx, GameBoard, useHoverPreview
} from 'strategy-game-factory';
import { CastleSvg } from './assets/castle-svg';
import { SoldierSvg } from './assets/soldier-svg';
import { smartBotStrategy } from './bot-strategy';
import { generateStartBoard, moves, SULTAN, type Board, type SoldierColor } from './gameplay';
import { Trans, useTranslation } from 'react-i18next';

interface Piece { rowIndex: number, pieceIndex: number }

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation('hunyadi-and-the-janissaries');
  const { value: validHoveredPiece, hoverProps } = useHoverPreview<Piece>(ctx.moveCount);

  const isPlayerSultan = ctx.currentPlayer === SULTAN;
  const groupOfHoveredPiece = validHoveredPiece
    ? board[validHoveredPiece.rowIndex][validHoveredPiece.pieceIndex]
    : null;

  const showToBeKilled = (group: SoldierColor) => {
    if (!ctx.isClientMoveAllowed || isPlayerSultan) return false;
    if (!validHoveredPiece) return false;
    return group === groupOfHoveredPiece;
  };

  // The same click means different things to the two roles: the sultan flips
  // the clicked soldier's colour, Hunyadi wipes out everyone sharing it. The
  // engine ignores whichever move is not the caller's to make, so no guard.
  const clickOnSoldier = ({ rowIndex, pieceIndex }: Piece) => {
    const group = board[rowIndex][pieceIndex];
    if (isPlayerSultan) {
      moves.setGroupOfSoldiers(board, [{ rowIndex, pieceIndex, group: group === 'red' ? 'blue' : 'red' }]);
    } else {
      moves.killGroup(board, group);
    }
  };

  return (
    <GameBoard>
      <SoldierSvg />
      <CastleSvg />
      <svg className={`m-auto w-[40%] fill-stone-600 ${board[0].length > 0 ? 'opacity-50' : ''}`}>
        <use xlinkHref="#game-castle" />
      </svg>
      <div className="relative">
        <div className="absolute z-20 left-0 right-0 bottom-0 mx-20 flex justify-center">
            {board[0].map((group, pieceIndex) => (
              <svg
                className={`
                  w-[10%] aspect-square mx-1
                  ${group === 'blue' ? 'fill-blue-800' : 'fill-red-800'}
                `}
                key={pieceIndex}
              >
                <use xlinkHref="#game-soldier-icon" />
              </svg>
            ))}
        </div>
      </div>
      {[1, 2, 3, 4, 5, 6].map(rowIndex => (
        <div
          key={rowIndex}
          style={{
            aspectRatio: rowIndex === 6 ? 24 : 8,
            marginLeft: (6 - rowIndex) + 'rem',
            marginRight: (6 - rowIndex) + 'rem'
          }}
          className="border-t-stone-600 border-t-2 p-0.5 text-center whitespace-nowrap"
        >
          {board[rowIndex] && board[rowIndex].map((group, pieceIndex) => (
            <button
              key={pieceIndex}
              disabled={!(isPlayerSultan
                ? moves.setGroupOfSoldiers.isAllowed(board, [{ rowIndex, pieceIndex, group }])
                : moves.killGroup.isAllowed(board, group))}
              className="aspect-square w-[10%] mx-1"
              onClick={() => clickOnSoldier({ rowIndex, pieceIndex })}
              {...hoverProps({ rowIndex, pieceIndex })}
            >
              <svg
                className={`
                  w-full aspect-square border-dashed border-slate-900 dark:border-slate-400
                  ${showToBeKilled(group) ? 'outline-dashed opacity-50' : ''}
                  ${group === 'blue' ? 'fill-blue-800' : 'fill-red-800'}
                `}
              >
                <use xlinkHref="#game-soldier-icon" />
              </svg>
            </button>
          ))}
        </div>
      ))}
      <button
        className={`
          primary-button w-auto m-auto mt-2
          ${moves.finalizeSeparation.isAllowed(board) ? '' : 'invisible'}
        `}
        disabled={!moves.finalizeSeparation.isAllowed(board)}
        onClick={() => moves.finalizeSeparation(board)}
      >
        {t('board.finishSplit')}
      </button>
    </GameBoard>
  );
};

const StepDescription = ({ ctx }: { ctx: Ctx }) => {
  const { t } = useTranslation('hunyadi-and-the-janissaries');
  return ctx.currentPlayer === SULTAN ? t('step.sultan') : t('step.hunyadi');
};

const Rule = () => {
  const { t } = useTranslation('hunyadi-and-the-janissaries');
  return <Trans t={t} i18nKey="rule" />;
};

export const HunyadiAndTheJanissaries = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    roleLabels: [
      t => t('hunyadi-and-the-janissaries:role.sultan'),
      t => t('hunyadi-and-the-janissaries:role.hunyadi')
    ],
    getPlayerStepDescription: ({ ctx }) => <StepDescription ctx={ctx} />
  },
  BoardClient,
  gameplay: { moves, endOfTurnMove: 'stepUp' },
  variants: [{ botStrategy: smartBotStrategy, generateStartBoard }]
});
