import React, { useState } from "react";
import { strategyGameFactory } from "../strategy-game";
import { range, isEqual, random, sample, difference, filter } from "lodash";

const generateNewBoard6 = () => {
  const discCount = random(3, 6);
  if (random(0, 1)) {
    const blueCount = sample(range(0, discCount + 1, 3));
    return [blueCount, discCount - blueCount];
  } else {
    const blueCount = sample(
      difference(range(0, discCount + 1), range(0, 9, 3))
    );
    return [blueCount, discCount - blueCount];
  }
};

const generateNewBoard10 = () => {
  const discCount = random(4, 10);
  if (random(0, 1)) {
    const blueCount = sample(range(0, discCount + 1, 3));
    return [blueCount, discCount - blueCount];
  } else {
    const blueCount = sample(
      difference(range(0, discCount + 1), range(0, 12, 3))
    );
    return [blueCount, discCount - blueCount];
  }
};

const gameBoardFactory = (maxDiscs) => {
  return ({ board, ctx }) => {
    const [hovered, setHovered] = useState(null);

    const select = (a, i) => {
      if (ctx.shouldPlayerMoveNext) {
        let newBoard = [...board];
        let d = newBoard[a] - i;
        newBoard[a] = i;
        if (a === 1) newBoard[0] += d;
        ctx.endPlayerTurn(getGameStateAfterMove(newBoard));
      }
    };

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
                board[1] > i + 2 ? (
                  <td
                    className="text-center aspect-square"
                    key={`red-disabled-${i}`}
                  >
                    <button
                      className="aspect-square w-full p-[5%] cursor-not-allowed"
                      disabled
                    >
                      <span
                        className={`w-[100%] aspect-square inline-block rounded-full mr-0.5 bg-red-800`}
                      ></span>
                    </button>
                  </td>
                ) : (
                  <td
                    className="text-center aspect-square"
                    key={`red-${i}`}
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
                          ${
                            ctx.shouldPlayerMoveNext && (isEqual(hovered, [1, i]) || isEqual(hovered, [1, i - 1]))
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
                board[0] > i + 2 ? (
                  <td
                    className="text-center aspect-square"
                    key={`blue-disabled-${i}`}
                  >
                    <button
                      className="aspect-square w-full p-[5%] cursor-not-allowed"
                      disabled
                    >
                      <span
                        className={`w-[100%] aspect-square inline-block rounded-full mr-0.5 bg-blue-800`}
                      ></span>
                    </button>
                  </td>
                ) : (
                  <td
                    className="text-center aspect-square"
                    key={`blue-${i}`}
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
                          ${
                            ctx.shouldPlayerMoveNext && (isEqual(hovered, [0, i]) || isEqual(hovered, [0, i - 1]))
                              ? "opacity-50 bg-slate-600"
                              : "bg-blue-800"
                          }`}
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
  let newBoard = [...board];
  const rem = newBoard[0] % 3;
  if (rem === 0) {
    const randomNonEmptyPile = sample(filter([0, 1], (i) => newBoard[i] > 0));
    const amount = newBoard[randomNonEmptyPile] > 1 ? sample([1, 2]) : 1;
    if (randomNonEmptyPile === 0) {
      newBoard[0] -= amount;
    } else {
      newBoard[0] += amount;
      newBoard[1] -= amount;
    }
  } else {
    const amount = 3 - rem;
    if (newBoard[1] >= amount && random(0, 1) === 1) {
      newBoard[0] += amount;
      newBoard[1] -= amount;
    } else {
      newBoard[0] -= rem;
    }
  }
  return getGameStateAfterMove(newBoard);
};

const getGameStateAfterMove = (newBoard) => {
  return {
    newBoard: newBoard,
    isGameEnd: isEqual(newBoard, [0, 0]),
    winnerIndex: null
  };
};

const getPlayerStepDescription = () => {
  return "Kattints egy korongra, hogy eltávolítsd vagy átfordítsd az adott és tőle jobbra levő korongo(ka)t az adott színből.";
};

const rule6 = (
  <>
    A játék kezdetén a szervezők néhány, de legfeljebb 6 korongot letesznek az
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

const rule10 = (
  <>
    A játék kezdetén a szervezők néhány, de legfeljebb 10 korongot letesznek az
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

const GameBoard6 = gameBoardFactory(6);
const GameBoard10 = gameBoardFactory(10);

const Game6 = strategyGameFactory({
  rule: rule6,
  title: "6 korong",
  GameBoard: GameBoard6,
  G: {
    getPlayerStepDescription,
    generateNewBoard: generateNewBoard6,
    getGameStateAfterAiTurn
  }
});

const Game10 = strategyGameFactory({
  rule: rule10,
  title: "10 korong",
  GameBoard: GameBoard10,
  G: {
    getPlayerStepDescription,
    generateNewBoard: generateNewBoard10,
    getGameStateAfterAiTurn
  }
});

export const SixDiscs = () => {
  const [board, setBoard] = useState(generateNewBoard6());

  return <Game6 board={board} setBoard={setBoard} />;
};

export const TenDiscs = () => {
  const [board, setBoard] = useState(generateNewBoard10());

  return <Game10 board={board} setBoard={setBoard} />;
};
