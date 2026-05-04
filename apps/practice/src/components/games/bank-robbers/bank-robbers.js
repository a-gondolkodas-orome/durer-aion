import React from 'react';
import { strategyGameFactory } from '../../game-factory/strategy-game';
import { range, cloneDeep, random, sample } from 'lodash';
import { aiBotStrategy } from './bot-strategy';

const BoardClient = ({ board, ctx, moves }) => {
  const getAngle = (index) => {
    const step = Math.PI*2/board.circle.length;
    return index*step + (board.firstMove === null ? 0 : board.firstMove*step);
  };

  const isAllowedMove = index => {
    if (!ctx.isClientMoveAllowed) return false;
    return isAllowedBank(index);
  }

  const isAllowedBank = index => {
    return getAllowedBanks(board).includes(index);
  }

  const clickBank = (index) => {
    if (!isAllowedMove(index)) return;
    moves.rob(board, index);
  }

  const getBankColor = index => {
    if (index === board.lastMove) return "fill-red-800 stroke-red-600";
    if (board.circle[index] === false) return "fill-red-800";
    if (!isAllowedBank(index)) return "fill-gray-400";
    return "fill-emerald-600";
  }

  return(
    <section className="p-2 shrink-0 grow basis-2/3">
      <svg width="100%" height="100%" viewBox='0 0 110 110'>
      {
        range(board.circle.length).map(index => (
          <line
          key={`${index-1}-${index}`}
          className="stroke-gray-600"
          x1={55+50*Math.cos(getAngle(index))} y1={55+50*Math.sin(getAngle(index))}
          x2={55+50*Math.cos(getAngle(index-1))} y2={55+50*Math.sin(getAngle(index-1))}
          strokeWidth={1.5}
          />
        ))}
    {range(board.circle.length).map(index => (
      <circle
        key={index}
        cx={55+50*Math.cos(getAngle(index))} cy={55+50*Math.sin(getAngle(index))}
        r="4%"
        className={`${getBankColor(index)}`}
        strokeWidth={index === board.lastMove ? "1%" : "0"}
        onClick={() => clickBank(index)}
        onKeyUp={(event) => {
          if (event.key === 'Enter') clickBank(index);
        }}
        tabIndex={isAllowedMove(index) ? 0 : undefined}
        role={isAllowedMove(index) ? 'button' : undefined}
        aria-label={isAllowedMove(index) ? `Bank ${index + 1}` : undefined}
      ></circle>
    ))}
    </svg>
    </section>
  );
};

const moves = {
  rob: (board, { events }, index) => {
    const nextBoard = cloneDeep(board);
    // so that ai strategy can be simpler: first move is always the same
    const transformedMove = board.firstMove === null ? 0 : index;
    if (board.firstMove === null) {
      nextBoard.firstMove = index;
    }
    nextBoard.lastMove = transformedMove;
    nextBoard.circle[transformedMove] = false;
    events.endTurn();
    if (getAllowedBanks(nextBoard).length === 0) {
      events.endGame();
    }
    return { nextBoard };
  }
}

const getAllowedBanks = board => {
  return range(board.circle.length).filter(i => {
    return board.circle[i] && (board.circle.at(i-1) || board.circle[(i+1)%board.circle.length]);
  })
}

const randomBotStrategy = ({ board, moves }) => {
  moves.rob(board, sample(getAllowedBanks(board)));
};

const rule = {
  hu: <>
    Bergengócia fővárosában legalább 7 és legfeljebb 10 bank található, melyek körben,
    a Nagykörút mentén helyezkednek el. Két rivális bűnbanda ezen bankok kirablását tervezi,
    mégpedig úgy, hogy felváltva választanak ki egy-egy bankot. Nem választanak ki olyat,
    amit már korábban az egyikük kifosztott, és olyat sem, aminek már mindkét szomszédját kirabolták,
    mert ott már lesben áll a rendőrség. Az a banda veszt, aki már nem talál bankot, amit kirabolhat.
    <br></br><em>C kategóriában 7, D kategóriában 9 bankkal szerepelt a feladat a versenyen.</em>
  </>,
  en: <>
    The capital of Bergengocia has between 7 and 10 banks arranged in a circle along the Grand Boulevard.
    Two rival gangs plan to rob these banks by taking turns selecting one bank at a time. They may not
    select a bank that has already been robbed, nor one whose both neighbours have already been robbed,
    as the police are lying in ambush there. The gang that can no longer find a bank to rob loses.
    <br></br><em>In category C the problem used 7 banks, in category D it used 9 banks.</em>
  </>
};

const generateStartBoard = () => {
  const n = random(0, 2) === 0 ? sample([8, 10]) : sample([7, 9]);
  return {
    circle: Array(n).fill(true),
    lastMove: null,
    firstMove: null
  }
}

export const BankRobbers = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Válassz egy kirabolható bankot.',
      en: 'Choose a bank that can be robbed.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt 🤖', en: 'Test 🤖' } },
    { botStrategy: aiBotStrategy, generateStartBoard, label: { hu: 'Okos 🤖', en: 'Smart 🤖' }, isDefault: true }
  ]
});
