import React, { useState } from 'react';
import { strategyGameFactory } from '../strategy-game';
import { getGameStateAfterAiTurn, isAllowed, getAllowedSuperset, isGameEnd, vertices } from './strategy';

const GameBoard = ({ board, ctx }) => {
  const [firstNode, setFirstNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  const connectNode = node => {
    if (!ctx.shouldPlayerMoveNext) return;
    if (firstNode === null) {
      setFirstNode(node);
    } else if (node === firstNode) {
      setFirstNode(null);
    } else {
      if (!isAllowed(board, { from: firstNode, to: node })) return;
      const nextBoard = [...board];
      nextBoard.push(getAllowedSuperset(board, { from: firstNode, to: node }));
      ctx.endPlayerTurn({ nextBoard, isGameEnd: isGameEnd(nextBoard), winnerIndex: null });
      setFirstNode(null);
    }
  };

  const isCandidateAllowed = (
    firstNode !== null && hoveredNode !== null &&
    isAllowed(board, { from: firstNode, to: hoveredNode })
  );

  const candidateEdge = getAllowedSuperset(board, { from: firstNode, to: hoveredNode });
  const candidateFromV = candidateEdge ? vertices[candidateEdge.from] : null;
  const candidateToV = candidateEdge ? vertices[candidateEdge.to] : null;

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
  <svg className="aspect-square">

    {/* edges */}
    {board.map(({ from, to }, idx) => (
      <line
        key={`${from}-${to}`}
        x1={vertices[from].cx} y1={vertices[from].cy}
        x2={vertices[to].cx} y2={vertices[to].cy}
        stroke={idx % 2 === ctx.playerIndex ? 'blue' : 'green'}
        strokeWidth="4"
      />
    ))}

    {/* candidate next edge */}
    {firstNode !== null && hoveredNode !== null && firstNode !== hoveredNode && (
      <line
      x1={candidateFromV.cx} y1={candidateFromV.cy}
      x2={candidateToV.cx} y2={candidateToV.cy}
      stroke={isCandidateAllowed ? 'blue' : 'red'}
      strokeWidth="2" strokeDasharray="4"
      />
    )}

    {/* grid nodes */}
    {vertices.map(vertex => (
      <circle
        key={vertex.id}
        cx={vertex.cx} cy={vertex.cy} r="2%" fill="black"
        className={`
          ${vertex.id === firstNode ? 'fill-blue-500' : ''}
          ${firstNode !== null && vertex.id === hoveredNode && firstNode !== hoveredNode && !isCandidateAllowed ? 'fill-red-400 cursor-not-allowed' : ''}
        `}
        onClick={() => connectNode(vertex.id)}
        onKeyUp={(event) => {
          if (event.key === 'Enter') connectNode(vertex.id);
        }}
        tabIndex={ctx.shouldPlayerMoveNext ? 0 : 'none'}
        onFocus={() => setHoveredNode(vertex.id)}
        onBlur={() => setHoveredNode(null)}
        onMouseOver={() => setHoveredNode(vertex.id)}
        onMouseOut={() => setHoveredNode(null)}
      />
    ))}
  </svg>
  </section>
  );
};

const rule = <>
  Egy indiánrezervátumban 10 totemoszlopot állítottak fel az ábrán látható háromszögrács szerint.
  Csendes Patak és Vörös Tűz a következő játékot szokták itt játszani: felváltva feszítenek ki köteleket két-két oszlop
  között, és minden kötél kifeszítésénél figyelnek arra, hogy a kifeszített kötél párhuzamos legyen a nagy háromszög
  egyik oldalával, illetve a kötél nem haladhat el olyan oszlop mellett, amelyet már egy másik kötél érint.
  Ezenkívül ha a jelenleg kifeszített kötél helyett annak egy egyenes vonalú meghosszabbítása is kifeszíthető
  a fenti feltételek mellett, akkor azt kell kifeszíteniük. Az veszít, amelyikőjük már nem tud a
  szabályoknak megfelelően több kötelet kifeszíteni.
</>;

const Game = strategyGameFactory({
  rule,
  title: '10 totemoszlop',
  GameBoard,
  G: {
    getPlayerStepDescription: () => 'Kattints két oszlopra, amik között kötelet szeretnél kifeszíteni.',
    generateStartBoard: () => [],
    getGameStateAfterAiTurn
  }
});

export const TriangularGridRopes = () => {
  const [board, setBoard] = useState([]);

  return <Game board={board} setBoard={setBoard} />;
};
