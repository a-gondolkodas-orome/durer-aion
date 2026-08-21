import { useState } from 'react';
import { range, map } from 'lodash';
import { strategyGameFactory, type BoardClientProps, GameBoard } from 'strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { startBoard, edges, moves, type Board } from './gameplay';
import { useTranslation } from 'language';

// Screen position of each node; the drawn skeleton (see `edges` in gameplay)
// connects these by node id.
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

export const nodeColors = {
  'red': {
    bg: 'bg-red-500 text-inherit enabled:hocus:bg-red-600',
    name: { hu: 'Piros', en: 'Red' },
    svg: 'var(--color-red-500)'
  },
  'blue': {
    bg: 'bg-blue-500 enabled:hocus:bg-blue-600',
    name: { hu: 'Kék', en: 'Blue' },
    svg: 'var(--color-blue-500)'
  },
  'yellow': {
    bg: 'bg-yellow-500 text-inherit enabled:hocus:bg-yellow-600',
    name: { hu: 'Sárga', en: 'Yellow' },
    svg: 'var(--color-yellow-500)'
  }
};

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  // null = no colour picked; picking the selected colour again deselects it
  const [color, setColor] = useState<string | null>(null);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  const isColoringAllowed = (vertex) => moves.colorVertex.isAllowed(board, { vertex, color });

  const pick = (pickedColor) => {
    if (!ctx.isClientMoveAllowed) return;
    setColor(pickedColor === color ? null : pickedColor);
  };

  const drawPickedColor = (event) => {
    const svg = event.currentTarget as SVGSVGElement;
    setX(event.nativeEvent.offsetX / svg.clientWidth * 100);
    setY(event.nativeEvent.offsetY / svg.clientHeight * 100);
  };

  const isNearAllowedNode = range(8).some(nodeId => {
    if (!isColoringAllowed(nodeId)) return false;
    const cx = parseFloat(cubeCoords[nodeId].cx);
    const cy = parseFloat(cubeCoords[nodeId].cy);
    return Math.hypot(x - cx, y - cy) < 6;
  });

  const setVertexColor = (vertex) => {
    // the engine ignores disallowed dispatches, but the guard is still needed
    // here: a rejected click must not clear the colour selection below
    if (!isColoringAllowed(vertex)) return;
    moves.colorVertex(board, { vertex, color });
    setColor(null);
  };

  return (
  <GameBoard>
    <header className="flex gap-2">
      {map(nodeColors, ({ bg, name }, colorKey) =>
        <button
          key={colorKey}
          disabled={!ctx.isClientMoveAllowed || (color !== null && color !== colorKey)}
          className={`primary-button ${bg}`}
          onClick={() => pick(colorKey)}
        >
          {t(name)}
        </button>
      )}
    </header>

    <svg
      onMouseMove={(event) => drawPickedColor(event)}
      className="aspect-square stroke-slate-900 dark:stroke-slate-300 stroke-3"
    >
      {edges.map(([from, to]) => (
        <line
          key={`${from}-${to}`}
          x1={cubeCoords[from].cx} y1={cubeCoords[from].cy}
          x2={cubeCoords[to].cx} y2={cubeCoords[to].cy}
        />
      ))}

      {/* <!-- 8 nodes --> */}
      {range(8).map(nodeId => (
        <circle
          key={nodeId}
          cx={cubeCoords[nodeId].cx} cy={cubeCoords[nodeId].cy} r="4%"
          onClick={() => setVertexColor(nodeId)}
          onKeyUp={(event) => {
            if (event.key === 'Enter') setVertexColor(nodeId);
          }}
          tabIndex={isColoringAllowed(nodeId) ? 0 : undefined}
          role={isColoringAllowed(nodeId) ? 'button' : undefined}
          aria-label={isColoringAllowed(nodeId) ? `Node ${nodeId + 1}` : undefined}
          fill={nodeColors[board[nodeId]]?.svg}
          className={!nodeColors[board[nodeId]]
            ? (isColoringAllowed(nodeId) || color === null
              ? 'fill-slate-50 dark:fill-slate-300'
              : 'fill-slate-400 dark:fill-slate-600')
            : undefined}
        />
      ))}

      {isNearAllowedNode && (
        <circle
          cx={x + '%'} cy={y + '%'} r="4%"
          fill={nodeColors[color!].svg}
          className="pointer-events-none opacity-50 stroke-0"
        />
      )}
    </svg>
  </GameBoard>
  );
};

const rule = {
  hu: <>
    Adott egy téglatest rácsa, aminek be van húzva az egyik testátlója.
    Egy lépésben az éppen soron lévő játékos megszínezi valamelyik még színezetlen csúcsot
    pirosra, sárgára vagy kékre úgy,
    hogy ne keletkezzen két szomszédos csúcs, amik azonos színűek.
    Ha valamelyik játékos nem tud lépni, akkor véget ér a játék.
    A kezdő játékos nyer, ha minden csúcs meg lett színezve, míg a második akkor nyer,
    ha van olyan csúcs ami nem lett kiszínezve.
  </>,
  en: <>
    The skeleton of a cuboid is given, in which one of the solid
    diagonals is drawn. On each turn the current player colours one of
    the yet uncoloured vertices with one of three colours (meaning that he
    puts a red, yellow or blue disc on top of the vertex) so that no two
    adjacent vertices have the same colour. The game ends when the
    next player can no longer move. The player who started
    wins if all the vertices have been coloured, whereas the second player
    wins if there remain uncoloured vertices.
  </>
};

export const CubeColoring = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Válassz színt, majd színezz meg egy csúcsot!',
      en: 'Choose a colour, then colour a vertex.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt', en: 'Test' } },
    { botStrategy: smartBotStrategy, startBoards: [startBoard], label: { hu: 'Teljes', en: 'Full' }, isDefault: true }
  ]
});
