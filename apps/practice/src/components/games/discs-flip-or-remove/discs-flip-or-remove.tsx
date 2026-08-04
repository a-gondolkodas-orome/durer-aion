import { strategyGameFactory, type BoardClientProps, GameBoard, useHoverPreview } from '../../strategy-game-factory';
import { range, isEqual } from 'lodash';
import { useTranslation } from '../../../language';
import { generateStartBoard, generateTestStartBoard, moves, type Board } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

const DisabledDisc = ({ bgColor }) => (
  <button className={`size-12 rounded-full ${bgColor}`} disabled />
);

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const { value: validHovered, hoverProps } = useHoverPreview<[number, number]>(ctx.moveCount);

  // Clicking the i-th disc of a pile takes everything above it, i.e.
  // board[pile] - i discs. The blue pile is removed from, the red one flipped.
  const moveForPile = (pile: number) => (pile === 0 ? moves.removeDiscs : moves.turnDiscs);

  const isSelectable = (pile: number, i: number) =>
    moveForPile(pile).isAllowed(board, board[pile] - i);

  const select = (pile, i) => moveForPile(pile)(board, board[pile] - i);

  const isSelected = (pile, i) => isEqual(validHovered, [pile, i]) || isEqual(validHovered, [pile, i - 1]);

  const fmt = (red, blue) => t({
    hu: ` → ${red} piros és ${blue} kék korong`,
    en: ` → ${red} red and ${blue} blue discs`
  });

  const nextBoardDescription = () => {
    if (validHovered === null) return '';
    if (!ctx.isClientMoveAllowed) return '';
    const count = board[validHovered[0]] - validHovered[1];
    if (validHovered[0] === 0) return fmt(board[1], board[0] - count);
    return fmt(board[1] - count, board[0] + count);
  };


  return (
    <GameBoard>
      <div className="flex flex-wrap gap-1">
        {range(board[1]).map((i) =>
          board[1] > i + 2
            ? <DisabledDisc key={`red-disabled-${i}`} bgColor="bg-red-800"/>
            : (
              <button
                key={`red-${i}-${board[0]}-${board[1]}`}
                className={`size-12 rounded-full ${
                  ctx.isClientMoveAllowed && isSelected(1, i)
                    ? "bg-blue-800/75"
                    : "bg-red-800"
                }`}
                disabled={!isSelectable(1, i)}
                onClick={() => select(1, i)}
                {...hoverProps([1, i])}
              />
            )
        )}

        {range(board[0]).map((i) =>
          board[0] > i + 2
            ? <DisabledDisc key={`blue-disabled-${i}`} bgColor="bg-blue-800"/>
            : (
              <button
                key={`blue-${i}-${board[0]}-${board[1]}`}
                className={`size-12 rounded-full bg-blue-800 ${isSelected(0, i) ? "enabled:opacity-50" : ""}`}
                disabled={!isSelectable(0, i)}
                onClick={() => select(0, i)}
                {...hoverProps([0, i])}
              />
            )
        )}
      </div>
      {t({
        hu: `${board[1]} piros és ${board[0]} kék korong`,
        en: `${board[1]} red and ${board[0]} blue discs`
      })}
      {nextBoardDescription()}
    </GameBoard>
  );
};

const getPlayerStepDescription = () => ({
  hu: 'Kattints a jobb szélső vagy az attól eggyel balra lévő kék korongra 1 vagy 2 kék korong ' +
    'elvételéhez, vagy tedd ugyanezt piros koronggal 1 vagy 2 piros korong kékké fordításához.',
  en: 'Click the rightmost or second-to-last blue disc to remove 1 or 2 blue discs, ' +
    'or do the same with red discs to flip 1 or 2 of them to blue.'
});

const rule = (maxDiscs) => ({
  hu: <>
    A játék kezdetén néhány, de legfeljebb {maxDiscs} piros vagy kék korong van az asztalon.
    A soron következő játékos összesen négyfélét léphet:
    <br />
    • 1 vagy 2 kék korongot elvehet az asztalról.
    <br />
    • 1 vagy 2 piros korongot átfordíthat kékké.
    <br />
    Az veszít, aki nem tud lépni.
  </>,
  en: <>
    At the start there are some discs on the table, at most {maxDiscs}, each either red or blue.
    The current player has four possible moves:
    <br />
    • Remove 1 or 2 blue discs from the table.
    <br />
    • Flip 1 or 2 red discs to blue.
    <br />
    The player who cannot move loses.
  </>
});

const genericRule = {
  hu: <>
    A játék kezdetén néhány piros vagy kék korong van az asztalon.
    A soron következő játékos összesen négyfélét léphet:
    <br />
    • 1 vagy 2 kék korongot elvehet az asztalról.
    <br />
    • 1 vagy 2 piros korongot átfordíthat kékké.
    <br />
    Az veszít, aki nem tud lépni.
  </>,
  en: <>
    At the start there are some red or blue discs on the table.
    The current player has four possible moves:
    <br />
    • Remove 1 or 2 blue discs from the table.
    <br />
    • Flip 1 or 2 red discs to blue.
    <br />
    The player who cannot move loses.
  </>
};

export const DiscsFlipOrRemove = strategyGameFactory({
  presentation: {
    rule: genericRule,
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      generateStartBoard: generateTestStartBoard,
      label: { hu: 'Teszt', en: 'Test' }
    },
    // smart bot: verified as optimal
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: generateStartBoard(6),
      rule: rule(6),
      label: { hu: '6 korong', en: '6 discs' },
      isDefault: true
    },
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: generateStartBoard(10),
      rule: rule(10),
      label: { hu: '10 korong', en: '10 discs' }
    }
  ]
});
