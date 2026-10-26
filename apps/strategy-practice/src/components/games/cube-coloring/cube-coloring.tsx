import { Trans, useTranslation } from 'react-i18next';
import { useState } from 'react';
import { range, map } from 'lodash';
import {
  strategyGameFactory, testVariantLabel, fullVariantLabel, type BoardClientProps, GameBoard
} from 'strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { startBoard, edges, moves, type Board } from './gameplay';

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

// Keyed by `colors` in gameplay — the logic-side palette — which is why this is
// only ever indexed with a board cell rather than a literal key. An uncoloured
// cell holds '' and misses; the two lookups below guard for that themselves.
export const nodeColors: Record<string, { bg: string; svg: string }> = {
  'red': {
    bg: 'bg-red-500 text-inherit enabled:hocus:bg-red-600',
    svg: 'var(--color-red-500)'
  },
  'blue': {
    bg: 'bg-blue-500 enabled:hocus:bg-blue-600',
    svg: 'var(--color-blue-500)'
  },
  'yellow': {
    bg: 'bg-yellow-500 text-inherit enabled:hocus:bg-yellow-600',
    svg: 'var(--color-yellow-500)'
  }
};

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation('cube-coloring');
  const colourName: Record<string, string> = {
    red: t('colour.red'),
    blue: t('colour.blue'),
    yellow: t('colour.yellow')
  };
  // null = no colour picked; picking the selected colour again deselects it
  const [color, setColor] = useState<string | null>(null);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  const isColoringAllowed = (vertex: number) => moves.colorVertex.isAllowed(board, { vertex, color });

  const pick = (pickedColor: string) => {
    if (!ctx.isClientMoveAllowed) return;
    setColor(pickedColor === color ? null : pickedColor);
  };

  const drawPickedColor = (event: React.MouseEvent<SVGSVGElement>) => {
    const svg = event.currentTarget;
    setX(event.nativeEvent.offsetX / svg.clientWidth * 100);
    setY(event.nativeEvent.offsetY / svg.clientHeight * 100);
  };

  const isNearAllowedNode = range(8).some(nodeId => {
    if (!isColoringAllowed(nodeId)) return false;
    const cx = parseFloat(cubeCoords[nodeId].cx);
    const cy = parseFloat(cubeCoords[nodeId].cy);
    return Math.hypot(x - cx, y - cy) < 6;
  });

  const setVertexColor = (vertex: number) => {
    // the engine ignores disallowed dispatches, but the guard is still needed
    // here: a rejected click must not clear the colour selection below
    if (!isColoringAllowed(vertex)) return;
    moves.colorVertex(board, { vertex, color });
    setColor(null);
  };

  return (
  <GameBoard>
    <header className="flex gap-2">
      {map(nodeColors, ({ bg }, colorKey) =>
        <button
          key={colorKey}
          disabled={!ctx.isClientMoveAllowed || (color !== null && color !== colorKey)}
          className={`primary-button ${bg}`}
          onClick={() => pick(colorKey)}
        >
          {colourName[colorKey]}
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

const Rule = () => {
  const { t } = useTranslation('cube-coloring');
  return <Trans t={t} i18nKey="rule" />;
};

const StepDescription = () => {
  const { t } = useTranslation('cube-coloring');
  return t('step');
};

export const CubeColoring = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: () => <StepDescription />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: testVariantLabel },
    { botStrategy: smartBotStrategy, startBoards: [startBoard], label: fullVariantLabel, isDefault: true }
  ]
});
