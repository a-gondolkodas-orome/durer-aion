import React, { useState } from 'react';
import { strategyGameFactory } from '../strategy-game';
import { range, sample, random } from 'lodash';

const primeList = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
  73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151,
  157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233,
  239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317,
  331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419,
  421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503,
  509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607,
  613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701,
  709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811,
  821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911,
  919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997
];

const generateNewBoard = () => {
  if (random(0, 1)) {
    return random(1, 166) * 6;
  } else {
    return random(1, 166) * 6 + random(1, 5);
  }
};

const GameBoard = ({ board, ctx }) => {
  const [firstTurnPhase, setFirstTurnPhase] = useState(true);
  const [playerPrime, setPlayerPrime] = useState(null);
  const [hovered, setHovered] = useState(null);

  const choosePrime = (p) => {
    setPlayerPrime(p);
    setFirstTurnPhase(false);
    ctx.setTurnStage("e");
    setHovered(null);
  }

  const chooseExponential = (e) => {
    setPlayerPrime(null);
    setFirstTurnPhase(true);
    ctx.setTurnStage("p");
    ctx.endPlayerTurn(getGameStateAfterMove(board - playerPrime ** e));
  }

  const generateTable = () => {
    let exponentCells = [];

    for(let e = 0; playerPrime**e <= board; e++) {
      const cell = <td
        className={`border-4 aspect-square ${hovered === e ? 'bg-gray-300' : ''}`}
        key={e}
        onClick={() => chooseExponential(e)}>
        <button
          className={`w-full p-[5%] aspect-square`}
          onMouseOver={() => setHovered(e)}
          onMouseOut={() => setHovered(null)}
          onFocus={() => setHovered(e)}
          onBlur={() => setHovered(null)}
        >{e}
        </button>
      </td>
      exponentCells.push(cell);
    }

    // https://tailwindcss.com/docs/content-configuration#dynamic-class-names
    // if we dynamically generate, tailwind won't recognize them :(
    const widthClassNames = [
      "",
      "w-[10%] min-w-[10%]",
      "w-[20%] min-w-[20%]",
      "w-[30%] min-w-[30%]",
      "w-[40%] min-w-[40%]",
      "w-[50%] min-w-[50%]",
      "w-[60%] min-w-[60%]",
      "w-[70%] min-w-[70%]",
      "w-[80%] min-w-[80%]",
      "w-[90%] min-w-[90%]",
      "w-[100%] min-w-[100%]"
    ][exponentCells.length]

    return (<table className={`m-2 border-collapse table-fixed ${widthClassNames}`}>
      <tbody><tr>
        {exponentCells.map(cell => (cell))}
      </tr></tbody>
    </table>);
  }

  let choosablePrimesList = primeList.filter(i => i <= board);
  if (choosablePrimesList.length === 0) {
    choosablePrimesList = [2];
  }

  const widthClassName = `w-[${(Math.min(choosablePrimesList.length, 10))*10}%]`;

  return (
    <section className='p-2 shrink-0 grow basis-2/3'>
      <p className='w-full text-8xl font-bold text-center'>{board}</p><br />
      {!ctx.shouldPlayerMoveNext ? ''
      : <>{firstTurnPhase ?
        <table className={`m-2 border-collapse table-fixed max-w-full ${widthClassName}`}><tbody>
          {range(Math.floor(choosablePrimesList.length/10)+1).map(i => (
            <tr key={i}>
              {range(Math.min(10, choosablePrimesList.slice(i*10, choosablePrimesList.length).length)).map(j => (
                <td
                  className={`max-w-[10%] border-4 ${hovered===primeList[10*i+j] ? `bg-gray-300` : ''}`}
                  onClick={() => choosePrime(primeList[10*i+j])}
                  key={`${primeList[10*i+j]}`}
                >
                  <button
                    className='w-full p-[5%] aspect-square'
                    onMouseOver={() => setHovered(primeList[10*i+j])}
                    onMouseOut={() => setHovered(null)}
                    onFocus={() => setHovered(primeList[10*i+j])}
                    onBlur={() => setHovered(null)}
                  >
                    {primeList[10*i+j]}
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody></table>
      : generateTable()}</>}
    </section>
  );
}

const getGameStateAfterMove = (newBoard) => {
  return { newBoard, isGameEnd: newBoard === 0, winnerIndex: null };
}

const getGameStateAfterAiTurn = ({ board }) => {
  if (board === 1) return getGameStateAfterMove(0);

  const availablePrimes = primeList.filter(p => p <= board);

  let chosenPrime;
  let chosenExponent;

  if (board % 6 === 0) {
    chosenPrime = sample(availablePrimes);
    chosenExponent = sample(availableExponents(board, chosenPrime));
  } else {
    let possibleMoves = [];
    for (p of availablePrimes) {
      for (e of availableExponents(board, p)) {
        if((board - p ** e) % 6 === 0) {
          possibleMoves.push([p, e]);
        }
      }
    }
    [chosenPrime, chosenExponent] = sample(possibleMoves);
  }
  return getGameStateAfterMove(board - chosenPrime**chosenExponent);
}

const availableExponents = (num, prime) => {
  const baseLog = Math.log(num) / Math.log(prime);
  const maxExponent = Math.floor(baseLog);
  return range(0, maxExponent + 1);
}

const getPlayerStepDescription = ({ turnStage }) => {
  return !(turnStage === "e")
    ? 'Válaszd ki a prímet, aminek a hatványát ki szeretnéd vonni.'
    : 'Válaszd ki a kitevőt, amelyre a prímet emelnéd.';
}

const rule = <>
Egy 1000-nél kisebb, (gép által meghatározott) pozitív egész számtól kezdődik a játék,
ebből a játékosok felváltva vonnak le egy tetszőleges
prímhatványt. Az nyer, aki a nullát mondja!
</>

const Game = strategyGameFactory({
  rule,
  title: 'Prímhatványok kivonása',
  GameBoard,
  G: {
    getPlayerStepDescription,
    generateNewBoard,
    getGameStateAfterAiTurn
  }
})

export const PrimeExponentials = () => {
  const [board, setBoard] = useState(generateNewBoard());

  return <Game board={board} setBoard={setBoard} />;
};
