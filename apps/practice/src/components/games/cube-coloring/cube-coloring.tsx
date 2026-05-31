import { useState } from 'react';
import { range, cloneDeep, every, some, map } from 'lodash';
import { strategyGameFactory, type Events, type BoardClientProps, GameBoard } from '../../game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { isAllowedStep, isColored, generateStartBoard, type Board } from './helpers';
import { useTranslation } from '../../language';

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
    bg: 'bg-red-500 text-black enabled:hocus:bg-red-600',
    name: { hu: 'Piros', en: 'Red' },
    svg: 'var(--color-red-500)'
  },
  'blue': {
    bg: 'bg-blue-500 enabled:hocus:bg-blue-600',
    name: { hu: 'Kék', en: 'Blue' },
    svg: 'var(--color-blue-500)'
  },
  'yellow': {
    bg: 'bg-yellow-500 text-black enabled:hocus:bg-yellow-600',
    name: { hu: 'Sárga', en: 'Yellow' },
    svg: 'var(--color-yellow-500)'
  }
};

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const [color, setColor] = useState('');
  const [show, setShow] = useState(false);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  const isMoveAllowed = (vertex) => {
    if (!ctx.isClientMoveAllowed) return false;
    if (!show) return false;
    return isAllowedStep(board, vertex, color);
  };

  const pick = (pickedColor) => {
    if (!ctx.isClientMoveAllowed) return;
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
    moves.colorVertex(board, { vertex, color });
    setShow(false);
  };

  return (
  <GameBoard>
    <header className="flex gap-2">
      {map(nodeColors, ({ bg, name }, colorKey) =>
        <button
          key={colorKey}
          disabled={!ctx.isClientMoveAllowed || (show && color !== colorKey)}
          className={`primary-button ${bg}`}
          onClick={() => pick(colorKey)}
        >
          {t(name)}
        </button>
      )}
    </header>

    <svg
      onMouseMove={(event) => drawPickedColor(event)}
      className="aspect-square stroke-black stroke-3"
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
          tabIndex={isMoveAllowed(nodeId) ? 0 : undefined}
          role={isMoveAllowed(nodeId) ? 'button' : undefined}
          aria-label={isMoveAllowed(nodeId) ? `Node ${nodeId + 1}` : undefined}
          fill={nodeColors[board[nodeId]]?.svg ?? (isMoveAllowed(nodeId) || !show ? 'white' : 'var(--color-slate-400)')}
        />
      ))}

      {/* <!-- cursor position with to-be-used color --> */}
      {x};{y}
      {show && (
        <circle
          cx={x} cy={y} r="4%"
          fill={nodeColors[color].svg}
          className="pointer-events-none opacity-50 stroke-0"
        />
      )}
    </svg>
  </GameBoard>
  );
};

const isGameEnd = (board: Board) => {
  const canUseColor = color => some(range(0, 8), v => isAllowedStep(board, v, color));
  return every(Object.keys(nodeColors), color => !canUseColor(color));
};

const moves = {
  colorVertex: (board: Board, { events }: { events: Events }, { vertex, color }) => {
    const nextBoard = cloneDeep(board);
    nextBoard[vertex] = color;
    events.endTurn();
    if (isGameEnd(nextBoard)) {
      const winnerIndex = every(range(0, 8), v => isColored(nextBoard, v)) ? 0 : 1;
      events.endGame(winnerIndex)
    }
    return { nextBoard };
  }
}

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
    Given is the skeleton of a cuboid in which one of the solid
    diagonals is drawn. Within a move the upcoming player colours one of
    the yet uncoloured vertices with one of three colours (meaning that he
    puts a red, yellow or blue disc on top of the vertex) in a way that no
    adjacent vertices can have the same colour. The game ends when the
    next player cannot make a move any longer. The player who started
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
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt 🤖', en: 'Test 🤖' } },
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Okos 🤖', en: 'Smart 🤖' }, isDefault: true }
  ]
});
