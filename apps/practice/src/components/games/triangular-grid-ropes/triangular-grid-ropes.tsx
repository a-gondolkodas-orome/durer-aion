import { useState } from 'react';
import { strategyGameFactory, type Events, type BoardClientProps, GameBoard } from '../../game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { isAllowed, getAllowedSuperset, isGameEnd, vertices, type Board } from './helpers';
import { cloneDeep } from 'lodash';

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const [firstNode, setFirstNode] = useState<number | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{ value: number; moveCount: number } | null>(null);
  const validHoveredNode = hoveredNode?.moveCount === ctx.moveCount ? hoveredNode.value : null;

  const connectNode = node => {
    if (!ctx.isClientMoveAllowed) return;
    if (firstNode === null) {
      setFirstNode(node);
    } else if (node === firstNode) {
      setFirstNode(null);
    } else {
      if (!isAllowed(board, { from: firstNode, to: node })) return;
      moves.stretchRope(board, { from: firstNode, to: node });
      setFirstNode(null);
    }
  };

  const isCandidateAllowed = (
    firstNode !== null && validHoveredNode !== null &&
    isAllowed(board, { from: firstNode, to: validHoveredNode })
  );

  const candidateEdge = getAllowedSuperset(board, { from: firstNode, to: validHoveredNode });
  const candidateFromV = candidateEdge ? vertices[candidateEdge.from] : null;
  const candidateToV = candidateEdge ? vertices[candidateEdge.to] : null;

  return (
  <GameBoard>
  <svg className="aspect-square">

    {/* edges */}
    {board.map(({ from, to }, idx) => (
      <line
        key={`${from}-${to}`}
        x1={vertices[from].cx} y1={vertices[from].cy}
        x2={vertices[to].cx} y2={vertices[to].cy}
        stroke={idx % 2 === 0 ? 'var(--color-blue-500)' : 'var(--color-green-500)'}
        strokeWidth="4"
      />
    ))}

    {/* candidate next edge */}
    {firstNode !== null && validHoveredNode !== null &&
      firstNode !== validHoveredNode && candidateFromV && candidateToV && (
      <line
      x1={candidateFromV.cx} y1={candidateFromV.cy}
      x2={candidateToV.cx} y2={candidateToV.cy}
      stroke={
        isCandidateAllowed
        ? (ctx.currentPlayer === 0 ? "var(--color-blue-500)" : "var(--color-green-500)")
        : 'var(--color-red-500)'
      }
      strokeWidth="2" strokeDasharray="4"
      />
    )}

    {/* grid nodes */}
    {vertices.map(vertex => {
      const isClickable = ctx.isClientMoveAllowed && (
        firstNode === null ||
        vertex.id === firstNode ||
        isAllowed(board, { from: firstNode, to: vertex.id })
      );
      const isInvalidHover = firstNode !== null &&
        vertex.id === validHoveredNode &&
        firstNode !== validHoveredNode &&
        !isCandidateAllowed;
      return (
      <circle
        key={vertex.id}
        cx={vertex.cx} cy={vertex.cy} r="2%"
        className={`
          ${vertex.id === firstNode
            ? (ctx.currentPlayer === 0 ? "fill-blue-500" : "fill-green-500")
            : isInvalidHover ? 'fill-red-500' : 'fill-slate-900 dark:fill-slate-300'
          }
        `}
        onClick={() => connectNode(vertex.id)}
        onKeyUp={(event) => {
          if (event.key === 'Enter') connectNode(vertex.id);
        }}
        tabIndex={isClickable ? 0 : undefined}
        role={isClickable ? 'button' : undefined}
        aria-label={isClickable ? `Node ${vertex.id + 1}` : undefined}
        onFocus={() => setHoveredNode({ value: vertex.id, moveCount: ctx.moveCount })}
        onBlur={() => setHoveredNode(null)}
        onPointerEnter={() => setHoveredNode({ value: vertex.id, moveCount: ctx.moveCount })}
        onPointerMove={() => setHoveredNode({ value: vertex.id, moveCount: ctx.moveCount })}
        onPointerLeave={() => setHoveredNode(null)}
      />
      );
    })}
  </svg>
  </GameBoard>
  );
};

const moves = {
  stretchRope: (board: Board, { events }: { events: Events }, { from, to }) => {
    const nextBoard = cloneDeep(board);
    nextBoard.push(getAllowedSuperset(board, { from, to })!);
    events.endTurn();
    if (isGameEnd(nextBoard)) {
      events.endGame();
    }
    return { nextBoard };
  }
}

const rule = {
  hu: <>
    Egy indiánrezervátumban 10 totemoszlopot állítottak fel az ábrán látható háromszögrács szerint.
    Csendes Patak és Vörös Tűz a következő játékot szokták itt játszani:
    felváltva feszítenek ki köteleket két-két oszlop
    között, és minden kötél kifeszítésénél figyelnek arra, hogy a kifeszített kötél párhuzamos legyen a nagy háromszög
    egyik oldalával, illetve a kötél nem haladhat el olyan oszlop mellett, amelyet már egy másik kötél érint.
    Ezenkívül ha a jelenleg kifeszített kötél helyett annak egy egyenes vonalú meghosszabbítása is kifeszíthető
    a fenti feltételek mellett, akkor azt kell kifeszíteniük. Az veszít, amelyikőjük már nem tud a
    szabályoknak megfelelően több kötelet kifeszíteni.
  </>,
  en: <>
    In an Indian reservatory there are 10 totem poles arranged according to the left
    figure. Silent Stream and Red Fire used to play the following game: In turns they stretch ropes
    between two-two poles in such a way that every stretched rope is parallel to a side of the big
    triangle and no rope can go along a pole that is already touched by another rope. Furthermoe,
    if instead of a rope one can stretch out a straight line extension of the rope, then one should
    stretch out this extension. The one who cannot stretch out more ropes according to the rules
    loses.
  </>
};

export const TriangularGridRopes = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Kattints két oszlopra, amik között kötelet szeretnél kifeszíteni.',
      en: 'Click two poles to connect them.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt 🤖', en: 'Test 🤖' } },
    {
      // smart bot: verified as optimal
      botStrategy: smartBotStrategy,
      generateStartBoard: (): Board => [],
      label: { hu: 'Okos 🤖', en: 'Smart 🤖' },
      isDefault: true
    }
  ]
});
