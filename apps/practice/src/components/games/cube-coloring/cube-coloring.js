import React, { useState } from 'react';
import { range } from 'lodash';
import { strategyGameFactory } from '../strategy-game';
import { isAllowedStep, getGameStateAfterMove, getGameStateAfterAiTurn } from './strategy';

const generateStartBoard = () => Array(8).fill(null);

const cubeCoords = [
  { cx: '8%',  cy: '25%' },
  { cx: '74%', cy: '25%' },
  { cx: '74%', cy: '91%' },
  { cx: '8%',  cy: '91%' },
  { cx: '25%', cy: '8%' },
  { cx: '91%', cy: '8%' },
  { cx: '91%', cy: '74%' },
  { cx: '25%', cy: '74%' }
];

const GameBoard = ({ board, setBoard, ctx }) => {
  const [color, setColor] = useState('');
  const [show, setShow] = useState(false);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  const isMoveAllowed = (vertex) => {
    if (!ctx.shouldPlayerMoveNext) return false;
    if (!show) return false;
    return isAllowedStep(board, vertex, color);
  };

  const pick = (pickedColor) => {
    if (!ctx.shouldPlayerMoveNext) return;
    if (pickedColor === color) {
      setShow(!show);
    } else {
      setShow(true);
      setColor(pickedColor);
    }
  };

  const drawPickedColor = (event) => {
    setX(event.nativeEvent.offsetX);
    setY(event.nativeEvent.offsetY);
  };

  const setVertexColor = (vertex) => {
    if (!isMoveAllowed(vertex)) return;
    const nextBoard = [...board];
    nextBoard[vertex] = color;
    setBoard(nextBoard);
    setShow(false);
    ctx.endPlayerTurn(getGameStateAfterMove(nextBoard));
  };

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    <header>
      <button
        disabled={!ctx.shouldPlayerMoveNext}
        className={`
          w-[30%] mx-[1%] rounded text-xl bg-red-600
          ${!show || color !== '#dc2626' ? 'bg-opacity-50' : ''}
        `}
        onClick={() => pick('#dc2626')}
      >Piros</button>
      <button
        disabled={!ctx.shouldPlayerMoveNext}
        className={`
          w-[30%] mx-[1%] rounded text-xl bg-yellow-600
          ${!show || color !== '#eab308' ? 'bg-opacity-50' : ''}
        `}
        onClick={() => pick('#eab308')}
      >Sárga</button>
      <button
        disabled={!ctx.shouldPlayerMoveNext}
        className={`
          w-[30%] mx-[1%] rounded text-xl bg-blue-600
          ${!show || color !== '#2563eb' ? 'bg-opacity-50' : ''}
        `}
        onClick={() => pick('#2563eb')}
      >Kék</button>
    </header>

    <svg
      onMouseMove={(event) => drawPickedColor(event)}
      className="aspect-square stroke-black stroke-[3]"
    >
      {/* <!-- front and back face --> */}
      <rect x="8%" y="25%" width="66%" height="66%" className="fill-transparent" />
      <rect x="25%" y="8%" width="66%" height="66%" className="fill-transparent" />

      {/* <!-- 4 edges connecting front and back face --> */}
      <line x1="8%" y1="25%" x2="25%" y2="8%"/>
      <line x1="74%" y1="25%" x2="91%" y2="8%"/>
      <line x1="74%" y1="91%" x2="91%" y2="74%"/>
      <line x1="8%" y1="91%" x2="25%" y2="74%"/>
      {/* <!-- main diagonal --> */}
      <line x1="74%" y1="91%" x2="25%" y2="8%"/>

      {/* <!-- 8 nodes --> */}
      {range(8).map(nodeId => (
        <circle
          key={nodeId}
          cx={cubeCoords[nodeId].cx} cy={cubeCoords[nodeId].cy} r="4%"
          onClick={() => setVertexColor(nodeId)}
          onKeyUp={(event) => {
            if (event.key === 'Enter') setVertexColor(nodeId);
          }}
          tabIndex={isMoveAllowed(nodeId) ? 0 : 'none'}
          fill={board[nodeId] || (isMoveAllowed(nodeId) || !show ? 'white' : 'gray')}
        />
      ))}

      {/* <!-- cursor position with to-be-used color --> */}
      {x};{y}
      {show && (
        <circle cx={x} cy={y} r="4%" fill={color} className="pointer-events-none opacity-50 stroke-0" />
      )}
    </svg>
  </section>
  );
};

const rule = <>
  Adott egy téglatest rácsa, aminek be van húzva az egyik testátlója.
  Egy lépésben az éppen soron lévő játékos megszínezi valamelyik még színezetlen csúcsot három szín valamelyikével
  (azaz piros, sárga vagy kék korongot tesz rá) úgy, hogy ne keletkezzen két szomszédos csúcs, amik azonos színűek.
  Ha valamelyik játékos nem tud lépni, akkor véget ér a játék.
  A kezdő játékos nyer, ha minden csúcs meg lett színezve, míg a második akkor nyer,
  ha van olyan csúcs ami nem lett kiszínezve.

  Te döntheted el, hogy kezdeni szeretnél-e, vagy második játékos lenni.
  Sok sikert! :)
</>;

const Game = strategyGameFactory({
  rule,
  title: 'Kockaszínezés',
  GameBoard,
  G: {
    getPlayerStepDescription: () => 'Válassz színt, majd színezz meg egy csúcsot!',
    generateStartBoard,
    getGameStateAfterAiTurn
  }
});

export const CubeColoring = () => {
  const [board, setBoard] = useState(generateStartBoard());

  return <Game board={board} setBoard={setBoard} />;
};
