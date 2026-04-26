import React, { useState } from "react";
import { strategyGameFactory } from "../../game-factory/strategy-game";
import { range, isEqual, random, sample, difference, filter, cloneDeep } from "lodash";
import { gameList } from "../gameList";
import { useTranslation } from "../../language/translate";

const generateStartBoard = (maxDiscs) => () => {
  const discCount = random(Math.floor(maxDiscs/2), maxDiscs);
  if (random(0, 1)) {
    const blueCount = sample(range(0, discCount + 1, 3));
    return [blueCount, discCount - blueCount];
  } else {
    const nextDivisibleBy3 = 3 * (Math.floor(maxDiscs/3) + 1);
    const blueCount = sample(
      difference(range(0, discCount + 1), range(0, nextDivisibleBy3, 3))
    );
    return [blueCount, discCount - blueCount];
  }
};

const DisabledDisc = ({ bgColor }) => {
  return (
    <td className="text-center aspect-square">
      <button
        className="aspect-square w-full p-[5%] cursor-not-allowed"
        disabled
      >
        <span
          className={`w-full aspect-square inline-block rounded-full mr-0.5 ${bgColor}`}
        ></span>
      </button>
    </td>
  );
};

const gameBoardFactory = (maxDiscs) => {
  return ({ board, ctx, moves }) => {
    const { t } = useTranslation();
    const [hovered, setHovered] = useState(null);

    const select = (pile, i) => {
      if (!ctx.isClientMoveAllowed) return;
      if (pile === 0) {
        moves.removeDiscs(board, board[0] - i);
      } else {
        moves.turnDiscs(board, board[1] - i);
      }
      setHovered(null);
    };

    const isSelected = (pile, i) => isEqual(hovered, [pile, i]) || isEqual(hovered, [pile, i - 1]);

    const fmt = (red, blue) => t({
      hu: ` --> ${red} piros és ${blue} kék korong`,
      en: ` --> ${red} red and ${blue} blue discs`
    });

    const nextBoardDescription = () => {
      if (hovered === null) return '';
      if (!ctx.isClientMoveAllowed) return '';
      if (hovered[0] === 0) {
        if (hovered[1] === board[0] - 1) return fmt(board[1], board[0] - 1);
        return fmt(board[1], board[0] - 2);
      }
      if (hovered[1] === board[1] - 1) return fmt(board[1] - 1, board[0] + 1);
      return fmt(board[1] - 2, board[0] + 2);
    }


    return (
      <section className="p-2 shrink-0 grow basis-2/3">
        <table className="table-fixed w-full">
          <tbody>
            <tr>
              {range(board[1]).map((i) =>
                board[1] > i + 2
                  ? <DisabledDisc key={`red-disabled-${i}`} bgColor="bg-red-800"/>
                  : (
                    <td
                      className="text-center aspect-square"
                      key={`red-${i}-${board[0]}-${board[1]}`}
                      onClick={() => select(1, i)}
                    >
                      <button
                        className="aspect-square w-full p-[5%]"
                        disabled={!ctx.isClientMoveAllowed}
                        onMouseOver={() => setHovered([1, i])}
                        onMouseOut={() => setHovered(null)}
                        onFocus={() => setHovered([1, i])}
                        onBlur={() => setHovered(null)}
                      >
                        <span
                          className={`
                            w-full aspect-square inline-block rounded-full mr-0.5
                            ${ctx.isClientMoveAllowed && isSelected(1, i)
                              ? "opacity-75 bg-blue-800"
                              : "bg-red-800"
                            }
                          `}
                        ></span>
                      </button>
                    </td>
                  )
              )}

              {range(board[0]).map((i) =>
                board[0] > i + 2
                  ? <DisabledDisc key={`blue-disabled-${i}`} bgColor="bg-blue-800"/>
                  : (
                    <td
                      className="text-center aspect-square"
                      key={`blue-${i}-${board[0]}-${board[1]}`}
                      onClick={() => select(0, i)}
                    >
                      <button
                        className="aspect-square w-full p-[5%]"
                        disabled={!ctx.isClientMoveAllowed}
                        onMouseOver={() => setHovered([0, i])}
                        onMouseOut={() => setHovered(null)}
                        onFocus={() => setHovered([0, i])}
                        onBlur={() => setHovered(null)}
                      >
                        <span
                          className={`
                            w-full aspect-square inline-block rounded-full mr-0.5
                            ${ctx.isClientMoveAllowed && isSelected(0, i)
                              ? "opacity-50 bg-slate-600"
                              : "bg-blue-800"
                            }
                          `}
                        ></span>
                      </button>
                    </td>
                  )
              )}

              {/* dummy cells to ensure stable piece width */}
              {range(maxDiscs - board[0] - board[1]).map((i) => (
                <td key={`dummy-${i}`}></td>
              ))}
            </tr>
          </tbody>
        </table>
        {t({
          hu: `${board[1]} piros és ${board[0]} kék korong`,
          en: `${board[1]} red and ${board[0]} blue discs` }
        )}
        {nextBoardDescription()}
      </section>
    );
  };
};

const moves = {
  removeDiscs: (board, { events }, count) => {
    const nextBoard = cloneDeep(board);
    nextBoard[0] -= count;
    events.endTurn();
    if (isEqual(nextBoard, [0, 0])) {
      events.endGame();
    }
    return { nextBoard };
  },
  turnDiscs: (board, { events }, count) => {
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

const aiBotStrategy = ({ board, moves }) => {
  const rem = board[0] % 3;
  if (rem === 0) {
    const randomNonEmptyPile = sample(filter([0, 1], (i) => board[i] > 0));
    const amount = board[randomNonEmptyPile] > 1 ? sample([1, 2]) : 1;
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
    title: gameList.SixDiscs.title || gameList.SixDiscs.name,
    credit: gameList.SixDiscs.credit,
    getPlayerStepDescription
  },
  BoardClient: gameBoardFactory(6),
  gameplay: { moves },
  variants: [{ botStrategy: aiBotStrategy, generateStartBoard: generateStartBoard(6) }]
});

export const TenDiscs = strategyGameFactory({
  presentation: {
    rule: rule(10),
    title: gameList.TenDiscs.title || gameList.TenDiscs.name,
    credit: gameList.TenDiscs.credit,
    getPlayerStepDescription
  },
  BoardClient: gameBoardFactory(10),
  gameplay: { moves },
  variants: [{ botStrategy: aiBotStrategy, generateStartBoard: generateStartBoard(10) }]
});
