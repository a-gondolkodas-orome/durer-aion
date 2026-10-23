import { useTranslation } from 'react-i18next';
import { range } from 'lodash';
import {
  strategyGameFactory, testVariantLabel, fullVariantLabel, type BoardClientProps, GameBoard
} from 'strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { startBoard, moves, type Board } from './gameplay';

const BoardClient = ({ board, moves }: BoardClientProps<Board>) => (
  <GameBoard>
    <div className="grid grid-cols-2 border-t-2 border-l-2">
      {range(board.length).map(id =>
        <button
          key={id}
          disabled={!moves.addPiece.isAllowed(board, id)}
          onClick={() => moves.addPiece(board, id)}
          className="aspect-square border-r-2 border-b-2 p-[4%]"
        >
          {range(board[id]).map((i) =>
            <span
              key={i}
              className={`
                m-[3%] aspect-square inline-block bg-blue-800 rounded-full
                ${board[id] <= 4 ? 'w-[40%]' : 'w-[25%]'}
              `}
            >
            </span>
          )}
      </button>
      )}
    </div>
  </GameBoard>
);

const Rule = () => {
  const { t } = useTranslation('distinct-squares');
  return t('rule.twoTimesTwo');
};

const StepDescription = () => {
  const { t } = useTranslation('distinct-squares');
  return t('step.twoTimesTwo');
};

export const TwoTimesTwo = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: () => <StepDescription />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: testVariantLabel },
    { botStrategy: smartBotStrategy, startBoards: [startBoard], label: fullVariantLabel, isDefault: true }
  ]
});
