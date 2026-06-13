import { useState } from "react";
import {
  strategyGameFactory, type Events, type StrategyArgs, type BoardClientProps, GameBoard
} from "../../game-factory";
import { range, isEqual, random, sample, difference, filter, cloneDeep } from "lodash";
import { useTranslation } from "../../language";

type Board = [number, number]

const generateStartBoard = (maxDiscs) => (): Board => {
  const discCount = random(Math.floor(maxDiscs/2), maxDiscs);
  if (random(0, 1)) {
    const blueCount = sample(range(0, discCount + 1, 3))!;
    return [blueCount, discCount - blueCount];
  } else {
    const nextDivisibleBy3 = 3 * (Math.floor(maxDiscs/3) + 1);
    const blueCount = sample(
      difference(range(0, discCount + 1), range(0, nextDivisibleBy3, 3))
    )!;
    return [blueCount, discCount - blueCount];
  }
};

const DisabledDisc = ({ bgColor }) => (
  <button className={`size-12 rounded-full ${bgColor}`} disabled />
);

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState<{ value: [number, number]; moveCount: number } | null>(null);
  const validHovered = hovered?.moveCount === ctx.moveCount ? hovered.value : null;

  const select = (pile, i) => {
    if (!ctx.isClientMoveAllowed) return;
    if (pile === 0) {
      moves.removeDiscs(board, board[0] - i);
    } else {
      moves.turnDiscs(board, board[1] - i);
    }
    setHovered(null);
  };

  const isSelected = (pile, i) => isEqual(validHovered, [pile, i]) || isEqual(validHovered, [pile, i - 1]);

  const hoverProps = (pile: number, i: number) => {
    const setPieceAsHovered = () => setHovered({ value: [pile, i], moveCount: ctx.moveCount });
    return {
      onPointerEnter: setPieceAsHovered,
      onPointerMove: setPieceAsHovered,
      onPointerLeave: () => setHovered(null),
      onFocus: setPieceAsHovered,
      onBlur: () => setHovered(null)
    };
  };

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
                disabled={!ctx.isClientMoveAllowed}
                onClick={() => select(1, i)}
                {...hoverProps(1, i)}
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
                disabled={!ctx.isClientMoveAllowed}
                onClick={() => select(0, i)}
                {...hoverProps(0, i)}
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

const moves = {
  removeDiscs: (board: Board, { events }: { events: Events }, count) => {
    const nextBoard = cloneDeep(board);
    nextBoard[0] -= count;
    events.endTurn();
    if (isEqual(nextBoard, [0, 0])) {
      events.endGame();
    }
    return { nextBoard };
  },
  turnDiscs: (board: Board, { events }: { events: Events }, count) => {
    const nextBoard = cloneDeep(board);
    nextBoard[1] -= count;
    nextBoard[0] += count;
    events.endTurn();
    if (isEqual(nextBoard, [0, 0])) {
      events.endGame();
    }
    return { nextBoard };
  }
};

const smartBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const rem = board[0] % 3;
  if (rem === 0) {
    const randomNonEmptyPile = sample(filter([0, 1], (i) => board[i] > 0))!;
    const amount = board[randomNonEmptyPile] > 1 ? sample([1, 2])! : 1;
    if (randomNonEmptyPile === 0) {
      moves.removeDiscs(board, amount);
    } else {
      moves.turnDiscs(board, amount);
    }
  } else {
    const amount = 3 - rem;
    if (board[1] >= amount && random(0, 1) === 1) {
      moves.turnDiscs(board, amount);
    } else {
      moves.removeDiscs(board, rem);
    }
  }
};

const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const validMoves: Array<() => void> = [];
  if (board[0] >= 1) validMoves.push(() => moves.removeDiscs(board, 1));
  if (board[0] >= 2) validMoves.push(() => moves.removeDiscs(board, 2));
  if (board[1] >= 1) validMoves.push(() => moves.turnDiscs(board, 1));
  if (board[1] >= 2) validMoves.push(() => moves.turnDiscs(board, 2));
  sample(validMoves)!();
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

export const SixDiscs = strategyGameFactory({
  presentation: {
    rule: rule(6),
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt 🤖', en: 'Test 🤖' } },
    {
      // smart bot: verified as optimal
      botStrategy: smartBotStrategy,
      generateStartBoard: generateStartBoard(6),
      label: { hu: 'Okos 🤖', en: 'Smart 🤖' },
      isDefault: true
    }
  ]
});

export const TenDiscs = strategyGameFactory({
  presentation: {
    rule: rule(10),
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt 🤖', en: 'Test 🤖' } },
    {
      // smart bot: verified as optimal
      botStrategy: smartBotStrategy,
      generateStartBoard: generateStartBoard(10),
      label: { hu: 'Okos 🤖', en: 'Smart 🤖' },
      isDefault: true
    }
  ]
});
