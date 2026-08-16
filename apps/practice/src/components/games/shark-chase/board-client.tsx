import { range } from 'lodash';

import { SharkSvg } from './assets/shark-chase-shark-svg';
import { SubmarineSvg } from './assets/shark-chase-submarine-svg';
import { useTranslation } from 'language';
import { type Board, RESEARCHERS, SHARK, sideLength } from './gameplay';
import { GameBoard, type BoardClientProps, useMoveScopedState } from 'strategy-game-factory';

// Tailwind scans for whole class names, so the grid width cannot be built by
// interpolation even though the side length is on the board.
const gridColumns: Record<number, string> = { 4: 'grid-cols-4', 5: 'grid-cols-5' };

// A piece drawn over a sector: SubmarineSvg/SharkSvg define the two symbols
// once for the whole board, so a piece is only ever a `use` of one of them.
const Piece = ({ symbol, className }: { symbol: 'shark' | 'submarine'; className: string }) => (
  <svg className={`aspect-square absolute ${className}`}>
    <use xlinkHref={`#${symbol}`} />
  </svg>
);

const topsByCount: Record<number, string[]> = {
  1: ['top-0'],
  2: ['top-[-10%]', 'top-[10%]'],
  3: ['top-[-10%]', 'top-0', 'top-[10%]'],
  4: ['top-[-15%]', 'top-[-5%]', 'top-[5%]', 'top-[15%]']
};

const SubmarinesInCell = ({ count }: { count: number }) => (
  <>
    {(topsByCount[count] ?? []).map(top => (
      <Piece key={top} symbol="submarine" className={`${top} z-20 opacity-80`} />
    ))}
  </>
);

// Where the ghost of the arriving submarine sits, chosen to fall between the
// ones already there rather than over one of them — the sectors it can reach
// keep the layout `topsByCount` gives them, since only the ghost is new.
const optionalNextTopByCount: Record<number, string> = {
  0: 'top-0',
  1: 'top-[10%]',
  2: 'top-0',
  3: 'top-[20%]'
};

const OptionalNextSubmarine = ({ existingSubmarineCount }: { existingSubmarineCount: number }) => (
  <Piece
    symbol="submarine"
    className={`z-40 opacity-50 ${optionalNextTopByCount[existingSubmarineCount]}`}
  />
);

// The two variants differ only in the size of the lake, which the board carries,
// and in how many days the shark has to survive, which it does not.
export const makeBoardClient = (maxTurn: number) => {
  const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
    const { t } = useTranslation();
    const [chosenPiece, setChosenPiece] = useMoveScopedState<number | null>(ctx.moveCount, null);
    const isCurrentPlayerResearcher = ctx.currentPlayer === RESEARCHERS;
    const isCurrentPlayerShark = ctx.currentPlayer === SHARK;
    const canInteract = ctx.isClientMoveAllowed;

    const canSelect = (id: number): boolean => {
      if (!canInteract) return false;
      if (isCurrentPlayerResearcher) return board.submarines[id] >= 1;
      if (isCurrentPlayerShark) return board.shark === id;
      return false;
    };

    const canMoveTo = (id: number): boolean => (isCurrentPlayerShark
      ? moves.moveShark.isAllowed(board, id)
      : chosenPiece !== null && moves.moveSubmarine.isAllowed(board, { from: chosenPiece, to: id }));

    const possibleMoves = new Set(range(board.submarines.length).filter(canMoveTo));

    // The click handler keeps its guards: a rejected click must leave the local
    // piece selection alone, which the engine's silent gating cannot do for us.
    const clickField = (id: number) => {
      if (!canInteract) return;
      if (isCurrentPlayerShark) {
        if (!canMoveTo(id)) return;
        moves.moveShark(board, id);
        return;
      }
      if (!isCurrentPlayerResearcher) return;
      if (chosenPiece !== null && canMoveTo(id)) {
        moves.moveSubmarine(board, { from: chosenPiece, to: id });
        setChosenPiece(null);
        return;
      }
      // Clicking the chosen submarine gives it up, and clicking another one
      // takes that one instead — a submarine out of reach of the chosen one is
      // a change of mind, not a move.
      setChosenPiece(id === chosenPiece || !canSelect(id) ? null : id);
    };

    // A sector holds nothing but SVG symbols, so each button needs a name of its
    // own to be usable without seeing the board.
    const cellLabel = (id: number): string => {
      const count = board.submarines[id];
      const contents: string[] = [];
      if (count >= 1) {
        contents.push(t({
          hu: `${count} tengeralattjáró`,
          en: `${count} submarine${count > 1 ? 's' : ''}`
        }));
      }
      if (board.shark === id) contents.push(t({ hu: 'cápa', en: 'shark' }));
      if (board.shark === id && isCurrentPlayerShark && canInteract) {
        contents.push(t({ hu: 'itt maradok', en: 'stay here' }));
      }
      const sector = t({ hu: `${id + 1}. szektor`, en: `Sector ${id + 1}` });
      return contents.length > 0 ? `${sector}: ${contents.join(', ')}` : sector;
    };

    return (
    <GameBoard>
      <p className='font-bold text-lg'>
        {t({ hu: 'Hátralévő lépések száma', en: 'Remaining moves' })}: {maxTurn + 1 - board.turn}
      </p>
      <SubmarineSvg/>
      <SharkSvg/>
      <div className={`grid ${gridColumns[sideLength(board)]} border-t-2 border-l-2`}>
        {range(board.submarines.length).map(id => (
          <button
            key={id}
            onClick={() => clickField(id)}
            disabled={!canSelect(id) && !canMoveTo(id)}
            aria-label={cellLabel(id)}
            aria-pressed={isCurrentPlayerResearcher && canSelect(id) ? chosenPiece === id : undefined}
            className={`
              aspect-square border-r-2 border-b-2 p-2 relative flex justify-center items-center
              disabled:cursor-default enabled:hocus:bg-blue-50 dark:enabled:hocus:bg-blue-950
              ${/* the ghosts say where the chosen submarine may go, but only the
                    pointer says which one is chosen — which leaves a touch or
                    keyboard player nothing to read */
                chosenPiece === id ? 'ring-2 ring-inset ring-blue-500' : ''}
              ${/* swimming into a submarine is a legal move, and loses on the spot */
                possibleMoves.has(id) && isCurrentPlayerShark && board.submarines[id]
                ? 'ring-2 ring-inset ring-red-600' : ''}
            `}
          >
            {board.submarines[id] >= 1 && (
              <SubmarinesInCell count={board.submarines[id]} />
            )}
            {possibleMoves.has(id) && isCurrentPlayerResearcher && (
              <OptionalNextSubmarine existingSubmarineCount={board.submarines[id]} />
            )}
            {board.shark === id && <Piece symbol="shark" className="top-0 z-10" />}
            {possibleMoves.has(id) && isCurrentPlayerShark && (
              <Piece symbol="shark" className="top-0 z-40 opacity-50" />
            )}
            {board.shark === id && isCurrentPlayerShark && canInteract && (
              // A label for what the sector button already does, not a control
              // of its own: a button may not hold another one, and a second tab
              // stop over the same action would only be in the way.
              <span
                className="absolute bottom-1 z-50 w-[95%] secondary-button text-xs p-0.5
                  pointer-events-none"
              >{t({ hu: 'Itt maradok', en: 'Stay here' })}</span>
            )}
        </button>
        ))}
      </div>
    </GameBoard>
    );
  };

  return BoardClient;
};
