import React, { useState } from 'react';
import { strategyGameFactory } from '../strategy-game';
import { range, isEqual, random, sample, difference, filter } from 'lodash';

const generateNewBoard6 = () => {
    const discCount = random(3, 6);
    if (random(0, 1)) {
        const blueCount = sample(range(0, discCount + 1, 3));
        return [blueCount, discCount - blueCount];
    } else {
        const blueCount = sample(difference(range(0, discCount + 1), range(0, 9, 3)));
        return [blueCount, discCount - blueCount]
    }
};

const generateNewBoard10 = () => {
    const discCount = random(4, 10);
    if (random(0, 1)) {
        const blueCount = sample(range(0, discCount + 1, 3));
        return [blueCount, discCount - blueCount];
    } else {
        const blueCount = sample(difference(range(0, discCount + 1), range(0, 12, 3)));
        return [blueCount, discCount - blueCount]
    }
};

const gameBoardFactory = maxDiscs => {
  return ({ board, ctx }) => {
      const [hovered, setHovered] = useState(null);

      const select = (a, i) => {
          if (ctx.shouldPlayerMoveNext) {
              let newBoard = [...board];
              let d = newBoard[a]-i;
              newBoard[a] = i;
              if(a===1) newBoard[0]+=d;
              ctx.endPlayerTurn(getGameStateAfterMove(newBoard));
          }
      };

      return (
          <section className="p-2 shrink-0 grow basis-2/3">
          <table className="m-2 border-collapse table-fixed w-full"><tbody>
          <tr>
              {range(Math.max(maxDiscs, board[1])).map(i => (
                  board[1]>i+2 ?
                      <td className='text-center aspect-square'
                          key = {i}>
                      <button
                          className="aspect-square w-full p-[5%]"
                          disabled={true}
                      >
                      <span
                          key={i}
                          className={`
                          w-[100%] aspect-square inline-block rounded-full mr-0.5 bg-red-800
                          `}>
                      </span></button></td>
                  : <>{board[1]>i ?
                      <td className='text-center aspect-square'
                          key = {i}
                          onClick = {() => select(1, i)}>
                      <button
                          className="aspect-square w-full p-[5%]"
                          disabled={!ctx.shouldPlayerMoveNext}
                          onMouseOver={() => setHovered([1, i])}
                          onMouseOut={() => setHovered(null)}
                          onFocus={() => setHovered([1, i])}
                          onBlur={() => setHovered(null)}
                      >
                      <span
                          key={i}
                          className={`
                          w-[100%] aspect-square inline-block rounded-full mr-0.5 bg-red-800
                          ${(ctx.shouldPlayerMoveNext && (isEqual(hovered,[1,i]) || isEqual(hovered, [1, i-1]))) ? 'opacity-50' : ''}
                          `}>
                      </span></button></td>
                          :<td className='text-center aspect-square' key={i}><button className="aspect-square w-full p-[5%]" disabled={true}></button></td>
                      }</>
              ))}
          </tr>
          <tr>
              {range(board[0]).map(i => (
                  board[0]>i+2 ?
                      <td className='text-center aspect-square'
                          key = {i}>
                      <button
                          className="aspect-square w-full p-[5%]"
                          disabled={true}
                      >
                      <span
                          key={i}
                          className={`
                          w-[100%] aspect-square inline-block rounded-full mr-0.5 bg-blue-800
                          `}>
                      </span></button></td>
                  : <>{board[0]>i ?
                      <td className='text-center aspect-square'
                          key = {i}
                          onClick = {() => select(0, i)}>
                      <button
                          className="aspect-square w-full p-[5%]"
                          disabled={!ctx.shouldPlayerMoveNext}
                          onMouseOver={() => setHovered([0, i])}
                          onMouseOut={() => setHovered(null)}
                          onFocus={() => setHovered([0, i])}
                          onBlur={() => setHovered(null)}
                      >
                      <span
                          key={i}
                          className={`
                          w-[100%] aspect-square inline-block rounded-full mr-0.5 bg-blue-800
                          ${(ctx.shouldPlayerMoveNext && (isEqual(hovered,[0,i]) || isEqual(hovered, [0, i-1]))) ? 'opacity-50' : ''}
                          `}>
                      </span></button></td>
                          :<td className='text-center aspect-square' key={i}><button className="aspect-square w-full p-[5%]" disabled={true}></button></td>
                      }</>
              ))}
              </tr>
          </tbody></table>
      </section>
      );

  };
}

const getGameStateAfterAiTurn = ({ board }) => {
    let newBoard = [...board];
    const rem = newBoard[0] % 3;
    if (rem === 0) {
        const randomNonEmptyPile = sample(filter([0, 1], i => newBoard[i] > 0));
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
        };
    }
    return getGameStateAfterMove(newBoard);
};

const getGameStateAfterMove = (newBoard) => {
    return { newBoard: newBoard, isGameEnd: isEqual(newBoard,[0,0]), winnerIndex: null };
};

const getPlayerStepDescription = () => {
    return "Kattints, hogy eltávolíts egy vagy két korongot egy színből.";
};

const rule6 = <>
A játék kezdetén a szervezők néhány, de legfeljebb 6 korongot letesznek az asztalra,
mindegyiket a piros vagy a kék felével felfelé. A soron következő játékos összesen négyfélét
léphet:<br/>
• 1 vagy 2 kék korongot elvehet az asztalról.<br/>
• 1 vagy 2 piros korongot átfordíthat kékké.<br/>
Aki már nem tud lépni, az elveszíti a játékot.
</>;

const rule10 = <>
A játék kezdetén a szervezők néhány, de legfeljebb 10 korongot letesznek az asztalra,
mindegyiket a piros vagy a kék felével felfelé. A soron következő játékos összesen négyfélét
léphet:<br/>
• 1 vagy 2 kék korongot elvehet az asztalról.<br/>
• 1 vagy 2 piros korongot átfordíthat kékké.<br/>
Aki már nem tud lépni, az elveszíti a játékot.
</>;

const GameBoard6 = gameBoardFactory(6);
const GameBoard10 = gameBoardFactory(10);

const Game6 = strategyGameFactory({
    rule: rule6,
    title: '6 korong',
    GameBoard: GameBoard6,
    G: {
        getPlayerStepDescription,
        generateNewBoard: generateNewBoard6,
        getGameStateAfterAiTurn
    }
});

const Game10 = strategyGameFactory({
  rule: rule10,
  title: '10 korong',
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
