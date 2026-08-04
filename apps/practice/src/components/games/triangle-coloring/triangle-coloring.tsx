import { strategyGameFactory, type BoardClientProps, GameBoard } from '../../strategy-game-factory';
import { range } from 'lodash';
import { ALLOWED, COLORED, FORBIDDEN, moves, triangles, type Board } from './gameplay';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';

// triangles
//          0
//       1  2  3
//    4  5  6  7  8
// 9 10 11 12 13 14 15

// vertices
//       0
//      1 2
//    3  4  5
//   6  7  8  9
// 10 11 12 13 14

// x, y, z: 3 "axis" showing parallel lines to triangle sides
const vertices = [
  { id: 0, x: 0, y: 4, z: 4, cx: "50", cy: "12.5" },
  { id: 1, x: 1, y: 3, z: 4, cx: "41.625", cy: "27.5" },
  { id: 2, x: 1, y: 4, z: 3, cx: "58.375", cy: "27.5" },
  { id: 3, x: 2, y: 2, z: 4, cx: "33.25", cy: "42.5" },
  { id: 4, x: 2, y: 3, z: 3, cx: "50", cy: "42.5" },
  { id: 5, x: 2, y: 4, z: 2, cx: "66.75", cy: "42.5" },
  { id: 6, x: 3, y: 1, z: 4, cx: "25", cy: "57.5" },
  { id: 7, x: 3, y: 2, z: 3, cx: "41.625", cy: "57.5" },
  { id: 8, x: 3, y: 3, z: 2, cx: "58.375", cy: "57.5" },
  { id: 9, x: 3, y: 4, z: 1, cx: "75", cy: "57.5" },
  { id: 10, x: 4, y: 0, z: 4, cx: "16.5", cy: "73" },
  { id: 11, x: 4, y: 1, z: 3, cx: "33.25", cy: "73" },
  { id: 12, x: 4, y: 2, z: 2, cx: "50", cy: "73" },
  { id: 13, x: 4, y: 3, z: 1, cx: "66.75", cy: "73" },
  { id: 14, x: 4, y: 4, z: 0, cx: "83.5", cy: "73" }
];

const BoardClient = ({ board, moves }: BoardClientProps<Board>) => {
  const getTrianglePoints = i => {
    const v = triangles[i].v;
    const [v0, v1, v2] = [vertices[v[0]], vertices[v[1]], vertices[v[2]]];
    return `${v0.cx},${v0.cy} ${v1.cx},${v1.cy} ${v2.cx},${v2.cy}`
  }

  const isClickable = i => moves.colorTriangle.isAllowed(board, i);

  const colorTriangle = i => moves.colorTriangle(board, i);

  const getColor = i => {
    if (board[i] === COLORED) return 'fill-blue-800';
    if (board[i] === FORBIDDEN) return 'fill-slate-900/40 dark:fill-white/20';
    return 'fill-transparent';
  };

  return(
    <GameBoard>
      <svg className="aspect-square" viewBox="0 0 100 100">
        <defs>
          <clipPath id="big-triangle-clip">
            <polygon points="50,12.5 16.5,73 83.5,73" />
          </clipPath>
        </defs>
        <g clipPath="url(#big-triangle-clip)">
          {range(16).map(i => (
            <polygon
              key={i}
              points={getTrianglePoints(i)}
              className={`${getColor(i)} stroke-slate-900 dark:stroke-slate-400`}
              strokeWidth="0.5"
              onClick={() => colorTriangle(i)}
              onKeyUp={(event) => {
                if (event.key === 'Enter') colorTriangle(i);
              }}
              tabIndex={isClickable(i) ? 0 : undefined}
              role={isClickable(i) ? 'button' : undefined}
              aria-label={isClickable(i) ? `Triangle ${i + 1}` : undefined}
            ></polygon>
          ))}
        </g>
        <polygon
          points="50,12.5 16.5,73 83.5,73"
          fill="none" className="stroke-slate-900 dark:stroke-slate-400" strokeWidth="0.5"
        />
      </svg>
    </GameBoard>
  );
};

const rule = {
  hu: <>
    Két játékos felváltva satíroz be az ábrán egy-egy kis háromszöget.
    Nem szabad olyan háromszöget satírozni, amelynek valamelyik oldalszomszédja
    már be van satírozva. Az veszít, aki nem tud satírozni.
  </>,
  en: <>
    Two players take turns colouring one small triangle.
    A triangle may only be coloured if none of its side-adjacent triangles have been coloured yet.
    The player who cannot move loses.
  </>
};

export const TriangleColoring = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Kattints egy kis háromszögre.',
      en: 'Click on a small triangle.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt', en: 'Test' } },
    {
      // smart bot: verified as optimal
      botStrategy: smartBotStrategy,
      generateStartBoard: () => Array(16).fill(ALLOWED),
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
