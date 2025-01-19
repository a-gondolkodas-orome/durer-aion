import React, { useState } from 'react';
import { strategyGameFactory } from '../strategy-game';
import { CastleSvg } from './assets/castle-svg';
import { SoldierSvg } from './assets/soldier-svg';
import { aiBotStrategy } from './bot-strategy';
import { generateStartBoard, moves } from './helpers';

const BoardClient = ({ board, ctx, moves }) => {
  const [hoveredPiece, setHoveredPiece] = useState(null);

  const isPlayerSultan = ctx.chosenRoleIndex === 0;
  const groupOfHoveredPiece = hoveredPiece
    ? board[hoveredPiece.rowIndex][hoveredPiece.pieceIndex]
    : null;

  const showToBeKilled = (group) => {
    if (!ctx.shouldRoleSelectorMoveNext || isPlayerSultan) return false;
    if (!hoveredPiece) return false;
    return group === groupOfHoveredPiece;
  };

  const clickOnSoldier = (rowIndex, pieceIndex) => {
    if (!ctx.shouldRoleSelectorMoveNext) return;

    if (isPlayerSultan) {
      const group = board[rowIndex][pieceIndex] === 'red' ? 'blue' : 'red';
      moves.setGroupOfSoldiers(board, [{ rowIndex, pieceIndex, group }]);
    } else {
      const group = board[rowIndex][pieceIndex];
      const { nextBoard, isGameEnd } = moves.killGroup(board, group);
      // TODO: ideally this is not a player initiated move but something that happens at the
      // end of turn by game engine
      if (!isGameEnd) {
        setTimeout(() => {
          moves.stepUp(nextBoard);
        }, 750)
      }
    }
  };

  return (
    <section className="p-2 shrink-0 grow basis-2/3">
      <SoldierSvg />
      <CastleSvg />
      <svg className={`m-auto w-[40%] fill-slate-600 ${board[0].length > 0 ? 'opacity-50' : ''}`}>
        <use xlinkHref="#game-castle" />
      </svg>
      <div className="relative">
        <div className="absolute z-20 left-0 right-0 bottom-0 mx-20 flex justify-center">
            {board[0].map((group, pieceIndex) => (
              <svg
                className={`
                  w-[10%] aspect-square inline-block mx-1
                  ${group === 'blue' ? 'fill-blue-600' : 'fill-red-600'}
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
          style={{ 'aspectRatio': rowIndex === 6 ? 24 : 8, 'marginLeft': (6-rowIndex) + 'rem', 'marginRight': (6-rowIndex) + 'rem' }}
          className="border-t-black border-t-2 p-0.5 text-center whitespace-nowrap"
        >
          {board[rowIndex] && board[rowIndex].map((group, pieceIndex) => (
            <button
              key={pieceIndex}
              disabled={!ctx.shouldRoleSelectorMoveNext}
              className="aspect-square w-[10%] inline-block mx-1"
              onClick={() => clickOnSoldier(rowIndex, pieceIndex)}
              onFocus={() => setHoveredPiece({ rowIndex, pieceIndex })}
              onBlur={() => setHoveredPiece(null)}
              onMouseOver={() => setHoveredPiece({ rowIndex, pieceIndex })}
              onMouseOut={() => setHoveredPiece(null)}
            >
              <svg
                className={`
                  w-full aspect-square inline-block border-dashed border-black
                  ${showToBeKilled(group) ? 'outline-dashed opacity-50' : ''}
                  ${group === 'blue' ? 'fill-blue-600' : 'fill-red-600'}
                `}
              >
                <use xlinkHref="#game-soldier-icon" />
              </svg>
            </button>
          ))}
        </div>
      ))}
      {isPlayerSultan && (
        <button
          className="cta-button"
          disabled={!ctx.shouldRoleSelectorMoveNext}
          onClick={() => moves.finalizeSeparation(board)}
        >
          Befejezem a kettéosztást
        </button>
      )}
    </section>
  );
};

const getPlayerStepDescription = ({ ctx: { chosenRoleIndex } }) => {
  return chosenRoleIndex === 0
  ? 'Kattints a katonákra és válaszd két részre a seregedet.'
  : 'Kattints egy katonára, hogy megsemmisítsd a vele azonos színű sereget.';
};

const rule = <>
  A török szultán serege megtámadta Hunyadi várát. A várlépcső egyes fokain néhány janicsár áll.
  Minden reggel a szultán kettéosztja a hadseregét egy piros és egy kék hadtestre.
  Hunyadi a nap folyamán vagy a piros, vagy a kék sereget megsemmisíti, választása szerint. Éjszaka minden megmaradt
  janicsár egy lépcsőfokot fellép.
  Hunyadi nyer, ha a szultán egész seregét megsemmisítette.
  A szultán nyer, ha lesz olyan janicsár, aki felér a várhoz.
</>;

export const HunyadiAndTheJanissaries = strategyGameFactory({
  rule,
  title: 'Hunyadi és a janicsárok',
  roleLabels: ['Szultán leszek', 'Hunyadi leszek'],
  BoardClient,
  getPlayerStepDescription,
  generateStartBoard,
  moves,
  aiBotStrategy
});
