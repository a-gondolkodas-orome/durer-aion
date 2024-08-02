import React, { useState } from "react";
import { strategyGameFactory } from "../strategy-game";
import { range, isEqual, random, sample, difference, filter } from "lodash";

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
          className={`w-[100%] aspect-square inline-block rounded-full mr-0.5 ${bgColor}`}
        ></span>
      </button>
    </td>
  );
};


const gameBoardFactory = (maxDiscs) => {
  return ({ board, ctx }) => {
    const [hovered, setHovered] = useState(null);

    const select = (pile, i) => {
      if (ctx.shouldPlayerMoveNext) {
        const nextBoard = [...board];
        const d = nextBoard[pile] - i;
        nextBoard[pile] = i;
        if (pile === 1) nextBoard[0] += d;
        setHovered(null);
        ctx.endPlayerTurn(getGameStateAfterMove(nextBoard));
      }
    };

    const isSelected = (pile, i) => isEqual(hovered, [pile, i]) || isEqual(hovered, [pile, i - 1]);

    const nextBoardDescription = () => {
      if (hovered === null) return '';
      if (!ctx.shouldPlayerMoveNext) return '';
      if (hovered[0] === 0) {
        if (hovered[1] === board[0] - 1) {
          return ` --> ${board[1]} piros és ${board[0] - 1} kék korong`
        }
        return ` --> ${board[1]} piros és ${board[0] - 2} kék korong`
      }
      if (hovered[1] === board[1] - 1) {
        return ` --> ${board[1] - 1} piros és ${board[0] + 1} kék korong`
      }
      return ` --> ${board[1] - 2} piros és ${board[0] + 2} kék korong`
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
                        disabled={!ctx.shouldPlayerMoveNext}
                        onMouseOver={() => setHovered([1, i])}
                        onMouseOut={() => setHovered(null)}
                        onFocus={() => setHovered([1, i])}
                        onBlur={() => setHovered(null)}
                      >
                        <span
                          className={`
                            w-[100%] aspect-square inline-block rounded-full mr-0.5
                            ${ctx.shouldPlayerMoveNext && isSelected(1, i) ? "opacity-75 bg-blue-800" : "bg-red-800"}
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
                        disabled={!ctx.shouldPlayerMoveNext}
                        onMouseOver={() => setHovered([0, i])}
                        onMouseOut={() => setHovered(null)}
                        onFocus={() => setHovered([0, i])}
                        onBlur={() => setHovered(null)}
                      >
                        <span
                          className={`
                            w-[100%] aspect-square inline-block rounded-full mr-0.5
                            ${ctx.shouldPlayerMoveNext && isSelected(0, i) ? "opacity-50 bg-slate-600" : "bg-blue-800"}
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
        {`${board[1]} piros és ${board[0]} kék korong${nextBoardDescription()}`}
      </section>
    );
  };
};

const getGameStateAfterAiTurn = ({ board }) => {
  const nextBoard = [...board];
  const rem = nextBoard[0] % 3;
  if (rem === 0) {
    const randomNonEmptyPile = sample(filter([0, 1], (i) => nextBoard[i] > 0));
    const amount = nextBoard[randomNonEmptyPile] > 1 ? sample([1, 2]) : 1;
    if (randomNonEmptyPile === 0) {
      nextBoard[0] -= amount;
    } else {
      nextBoard[0] += amount;
      nextBoard[1] -= amount;
    }
  } else {
    const amount = 3 - rem;
    if (nextBoard[1] >= amount && random(0, 1) === 1) {
      nextBoard[0] += amount;
      nextBoard[1] -= amount;
    } else {
      nextBoard[0] -= rem;
    }
  }
  return getGameStateAfterMove(nextBoard);
};

const getGameStateAfterMove = (nextBoard) => {
  return {
    nextBoard: nextBoard,
    isGameEnd: isEqual(nextBoard, [0, 0]),
    winnerIndex: null
  };
};

const getPlayerStepDescription = () => {
  return "Kattints egy korongra, hogy eltávolítsd vagy átfordítsd az adott és tőle jobbra levő korongo(ka)t az adott színből.";
};

const rule = (maxDiscs) => (
  <>
    A játék kezdetén a szervezők néhány, de legfeljebb {maxDiscs} korongot letesznek az
    asztalra, mindegyiket a piros vagy a kék oldalával felfelé. A soron
    következő játékos összesen négyfélét léphet:
    <br />
    • 1 vagy 2 kék korongot elvehet az asztalról.
    <br />
    • 1 vagy 2 piros korongot átfordíthat kékké.
    <br />
    Aki már nem tud lépni, az elveszíti a játékot.
  </>
);

const Game6 = strategyGameFactory({
  rule: rule(6),
  title: "6 korong",
  GameBoard: gameBoardFactory(6),
  G: {
    getPlayerStepDescription,
    generateStartBoard: generateStartBoard(6),
    getGameStateAfterAiTurn
  }
});

const Game10 = strategyGameFactory({
  rule: rule(10),
  title: "10 korong",
  GameBoard: gameBoardFactory(10),
  G: {
    getPlayerStepDescription,
    generateStartBoard: generateStartBoard(10),
    getGameStateAfterAiTurn
  }
});

export const SixDiscs = () => {
  const [board, setBoard] = useState(generateStartBoard(6));

  return <Game6 board={board} setBoard={setBoard} />;
};

export const TenDiscs = () => {
  const [board, setBoard] = useState(generateStartBoard(10));

  return <Game10 board={board} setBoard={setBoard} />;
};
