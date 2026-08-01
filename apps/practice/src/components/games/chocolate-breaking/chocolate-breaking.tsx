import { range } from 'lodash';
import {
  strategyGameFactory, type BoardClientProps, type Ctx, type Events, GameBoard, useHoverPreview
} from '../../strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import {
  generateStartBoard, generateTestStartBoard, safeBreaks, hasSafeBreak,
  applyBreak, isBreakAllowed, type Board, type Piece, type Move
} from './helpers';

const CELL = 30; // px per chocolate cell
const CUT = 18; // px hit area of a cut line

const PieceView = ({ piece, ctx, hovered, setHovered, clearHovered, onActivate }: {
  piece: Piece;
  ctx: Ctx;
  hovered: Move | null;
  setHovered: (h: Move) => void;
  clearHovered: () => void;
  onActivate: (move: Move) => void;
}) => {
  const { w, h } = piece;
  const breaks = safeBreaks(piece);

  const hoveredHere = ctx.isClientMoveAllowed && hovered?.id === piece.id
    ? breaks.find(br => br.dir === hovered.dir && br.pos === hovered.pos)
    : undefined;

  const label = hoveredHere
    ? `${w}×${h} → ${hoveredHere.a.w}×${hoveredHere.a.h} + ${hoveredHere.b.w}×${hoveredHere.b.h}`
    : `${w}×${h}`;

  return (
    <div className="flex flex-col items-center m-1.5">
      <div className="relative" style={{ width: w * CELL, height: h * CELL }}>
        <div
          className="grid w-full h-full"
          style={{ gridTemplateColumns: `repeat(${w},1fr)`, gridTemplateRows: `repeat(${h},1fr)` }}
        >
          {range(w * h).map(i => (
            <div key={i} className="border border-amber-950/60 bg-amber-700 dark:bg-amber-800" />
          ))}
        </div>
        {ctx.isClientMoveAllowed && breaks.map(br => {
          const active = hoveredHere?.dir === br.dir && hoveredHere?.pos === br.pos;
          const style = br.dir === 'v'
            ? { left: br.pos * CELL, top: 0, height: h * CELL, width: CUT, transform: 'translateX(-50%)' }
            : { left: 0, top: br.pos * CELL, width: w * CELL, height: CUT, transform: 'translateY(-50%)' };
          const cut = { id: piece.id, dir: br.dir, pos: br.pos };
          // Resting state shows a dashed "break here" guide so the cut lines are
          // discoverable without hovering (e.g. on touch screens); the selected
          // cut becomes a solid blue line.
          const line = active
            ? `bg-blue-600 rounded-full ${br.dir === 'v' ? 'w-1 h-full' : 'h-1 w-full'}`
            : br.dir === 'v'
              ? 'h-full border-l-2 border-dashed border-amber-100/70 dark:border-amber-100/40'
              : 'w-full border-t-2 border-dashed border-amber-100/70 dark:border-amber-100/40';
          return (
            <button
              key={`${br.dir}${br.pos}`}
              className="absolute flex items-center justify-center cursor-pointer touch-manipulation"
              style={style}
              aria-label={`${w}×${h} → ${br.a.w}×${br.a.h} + ${br.b.w}×${br.b.h}`}
              onClick={() => onActivate(cut)}
              onFocus={() => setHovered(cut)}
              onBlur={clearHovered}
              onPointerEnter={e => { if (e.pointerType === 'mouse') setHovered(cut); }}
              onPointerLeave={e => { if (e.pointerType === 'mouse') clearHovered(); }}
            >
              <span className={`transition-colors ${line}`} />
            </button>
          );
        })}
      </div>
      <p className={`text-xs mt-1 ${hoveredHere ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500'}`}>
        {label}
      </p>
    </div>
  );
};

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { value: hovered, set: setHovered, clear: clearHovered } = useHoverPreview<Move>(ctx.moveCount);

  // A cut is broken once it is the highlighted one: on desktop hover/focus
  // highlights it so a single click/Enter breaks straight away; on touch the
  // first tap highlights (showing the preview) and the second tap confirms.
  // The guard stays: the first tap only moves local highlight state, which the
  // engine's move check does not cover.
  const onActivate = (move: Move) => {
    if (!ctx.isClientMoveAllowed) return;
    const isSelected = hovered?.id === move.id
      && hovered?.dir === move.dir && hovered?.pos === move.pos;
    if (isSelected) moves.breakPiece(board, move);
    else setHovered(move);
  };

  return (
    <GameBoard>
      <div className="flex flex-wrap justify-center items-start">
        {board.pieces.map(piece => (
          <PieceView
            key={piece.id}
            piece={piece}
            ctx={ctx}
            hovered={hovered}
            setHovered={setHovered}
            clearHovered={clearHovered}
            onActivate={onActivate}
          />
        ))}
      </div>
    </GameBoard>
  );
};

const moves = {
  breakPiece: {
    validate: (board: Board, _, move: Move) => isBreakAllowed(board, move),
    apply: (board: Board, { events }: { events: Events }, move: Move) => {
      const nextBoard = applyBreak(board, move);
      events.endTurn();
      if (!hasSafeBreak(nextBoard.pieces)) {
        events.endGame();
      }
      return { nextBoard };
    }
  }
};

const rule = {
  hu: <>
    Két játékos felváltva tör egy tábla csokit a rácsvonalai mentén. Kezdetben egy téglalap alakú
    csokoládé van, egy lépésben pontosan egy darabot törnek ketté. Az veszít, aki az első 1 × 1-est
    kénytelen letörni.
  </>,
  en: <>
    Two players take turns breaking a chocolate bar along its grid lines. Initially there is one
    rectangular bar; in one move a player breaks exactly one piece into two. The player forced to
    break off the first 1 × 1 piece loses.
  </>
};

export const ChocolateBreaking = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Törj ketté egy csokidarabot egy rácsvonal mentén (1 × 1-est nem törhetsz le).',
      en: 'Break a chocolate piece in two along a grid line (you may not break off a 1 × 1).'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      generateStartBoard: generateTestStartBoard,
      label: { hu: 'Teszt', en: 'Test' }
    },
    {
      // smart bot: optimal via Sprague–Grundy values (see helpers.ts / bot-strategy.ts)
      botStrategy: smartBotStrategy,
      generateStartBoard,
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
