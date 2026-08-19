import { range } from 'lodash';
import type { ComponentPropsWithoutRef, FocusEvent, PointerEvent, ReactNode } from 'react';

// How the pile reads while a discard is being aimed at it: `preview` is a pile
// the pointer is merely over, `chosen` one already picked this turn. Two piles
// of the family have no discard to aim (the two-pile game implies it), so both
// states are optional in practice.
export type DiscardState = 'no' | 'preview' | 'chosen';

type PileCardProps = {
  size: number;
  // the pile's count, plus what the move under the pointer would leave of it
  caption: ReactNode;
  discard?: DiscardState;
  // Pieces up to and including `splitAfter` are coloured as the first of the
  // two piles a cut here would leave behind, the rest as the second. `null`
  // previews nothing.
  splitAfter?: number | null;
  headerAction?: ReactNode;
  // Set while a click on a piece acts on the pile rather than on that piece —
  // the discard half of a turn. The pieces then answer the pointer as the pile
  // they stand for, without one of them lighting up as if it were the target.
  piecesStandForThePile?: boolean;
  pieceProps: (pieceId: number) => ComponentPropsWithoutRef<'button'>;
  // spread onto the card itself, for a game where the pile as a whole is a
  // click target
  cardProps?: ComponentPropsWithoutRef<'div'>;
};

/**
 * Whether this device can preview a piece before the click that plays it. Where
 * it can, a click plays the turn outright, as this family always has; where it
 * cannot, the first tap previews and the second plays (see either client's
 * `clickPiece`), which is what replaces the split the pieces used to be
 * labelled with.
 *
 * Asking the device rather than reading the preview back is what keeps the
 * mouse a single click: hover and click can land in one frame, and the click
 * handler then still closes over the render before the preview.
 */
export const previewsByHover = () =>
  typeof window === 'undefined'
    || typeof window.matchMedia !== 'function'
    || window.matchMedia('(hover: hover)').matches;

/**
 * `useHoverPreview`'s `hoverProps`, narrowed to the input that actually carries
 * a hover: a mouse previews by hovering and a keyboard by tabbing, and a tap
 * previews nothing, so that the tap the pieces are left to preview with is not
 * also read as the tap that confirms.
 *
 * A tap focuses the button too, which is why the focus handler asks for
 * `:focus-visible` — without it the tap meant to preview would confirm in the
 * same breath, on the browsers that focus a button on tap.
 */
export const previewProps = <T, >(value: T, { set, clear }: PreviewControls<T>) => {
  const onMouseOnly = (e: PointerEvent, react: () => void) => {
    if (e.pointerType === 'mouse') react();
  };

  return {
    onPointerEnter: (e: PointerEvent) => onMouseOnly(e, () => set(value)),
    onPointerMove: (e: PointerEvent) => onMouseOnly(e, () => set(value)),
    onPointerLeave: (e: PointerEvent) => onMouseOnly(e, clear),
    onFocus: (e: FocusEvent) => { if (e.target.matches(':focus-visible')) set(value); },
    onBlur: clear
  };
};

type PreviewControls<T> = { set: (value: T) => void; clear: () => void };

const pieceColor = (isDiscarded: boolean, isInFirstHalf: boolean) => {
  if (isDiscarded) return 'bg-slate-400 dark:bg-slate-600';
  return isInFirstHalf ? 'bg-blue-600' : 'bg-green-600';
};

// The smallest a piece may be drawn, and so what decides how many go in a row.
// It is a tap target as much as a disc, which is what keeps it this side of the
// size the pieces could otherwise shrink to on a phone.
const pieceColumns = 'grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))]';

// The ring sits a pixel off the piece, so its offset has to be painted in the
// card's own colour — `bg-surface-elevated` has no ring-offset counterpart.
const cutRing = 'ring-2 ring-blue-800 dark:ring-blue-300 ring-offset-1 ring-offset-slate-50 dark:ring-offset-slate-800';

/**
 * One pile of a pile-splitting game, drawn as its own card: which piece belongs
 * to which pile is then a question the layout answers by itself, at any pile
 * count and any pile size, where a shared board with dividers between the piles
 * has to keep answering it as the sizes shift.
 *
 * Nothing here is sized in pixels. The card fills the column the board gives
 * it, and the pieces fill the card: as many to a row as fit at a piece's
 * smallest legible size, each piece then stretching into whatever the division
 * left over. So the same board is a pair of dense little cards on a phone and
 * the full width of the board area on a desktop, without a breakpoint deciding
 * either — and two piles compare at a glance, since every card is one width and
 * every row one length.
 *
 * The split preview is a colour and a ring on the piece cut at, and never a
 * gap: the pieces the two halves would be laid out in stay in the one grid, in
 * the slots they already occupy. Moving them is what would put a different piece
 * under a stationary pointer, and — since a piece would change parent — drop
 * the focus of anyone walking the pile by keyboard.
 */
export const PileCard = ({
  size,
  caption,
  discard = 'no',
  splitAfter = null,
  headerAction,
  piecesStandForThePile = false,
  pieceProps,
  cardProps
}: PileCardProps) => {
  // An emptied pile is the beat between the two halves of a turn — the discard
  // has been played and the split has not — so it reads as discarded too.
  const isDiscarded = discard !== 'no' || size === 0;

  return (
    <div
      className={`
        w-full min-w-0 flex flex-col rounded-lg border-2 px-2 pt-1 pb-2 bg-surface-elevated
        ${discard === 'chosen' ? 'border-blue-500' : ''}
        ${isDiscarded ? 'opacity-60' : ''}
      `}
      {...cardProps}
    >
      {/* The caption grows as it takes on what the hovered move would leave
          ("15" → "15 → 🗑️"), so the action is pinned to the corner rather than
          laid out beside it: in a row the two share, hovering the button is
          what moves it out from under the pointer. */}
      <div className="relative flex items-center justify-center h-8">
        <span className="text-base sm:text-lg font-semibold tabular-nums whitespace-nowrap">
          {caption}
        </span>
        <span className="absolute right-0">{headerAction}</span>
      </div>
      {/* `auto-fill` is what makes the board fluid: a row takes as many pieces
          as fit at their smallest size and shares the remainder between them, so
          a wider card spends the width on more pieces per row rather than on
          emptiness, and a narrower one drops to fewer instead of overflowing.

          Flipping the grid stacks the pile from the floor of the card up, which
          leaves the short row on top where a real pile is uneven, and puts the
          lower half of a split below the upper one. The pieces are discs, so
          nothing has to be flipped back. `mt-auto` is the floor itself: cards in
          a row stretch to the tallest, so without it a small pile would hang
          from the caption rather than resting where the others rest. */}
      <div className={`grid gap-0.5 min-h-7 mt-auto -scale-y-100 ${pieceColumns}`}>
        {range(size).map(pieceId => (
          <button
            key={pieceId}
            type="button"
            className={`
              aspect-square w-full flex items-center justify-center rounded-full
              ${piecesStandForThePile
                ? ''
                : 'enabled:hocus:bg-slate-200 dark:enabled:hocus:bg-slate-700'}
            `}
            {...pieceProps(pieceId)}
          >
            <span className={`
              block w-[85%] aspect-square rounded-full
              ${pieceColor(isDiscarded, splitAfter === null || pieceId <= splitAfter)}
              ${pieceId === splitAfter ? cutRing : ''}
            `} />
          </button>
        ))}
      </div>
    </div>
  );
};

// How the piles share the board's width. Wrapping them as they happen to fit
// leaves four piles as a row of three and a stray fourth, so the column count is
// spelled out per pile count instead: two side by side, three in a row once
// there is room for one, four as a square. Four in a line is not among them —
// the board shares its width with the sidebar, and even a wide window leaves
// each pile too narrow to be worth the row.
const columnClass: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2'
};

// The columns divide the width rather than being carved out of it at a fixed
// size: whatever the board is given, the piles have it between them, and no
// card can be pushed past its neighbour by content it cannot shrink below.
export const PileArea = ({ pileCount, children }: { pileCount: number; children: ReactNode }) => (
  <div className={`
    grid w-full gap-2 sm:gap-3 p-1
    ${columnClass[pileCount] ?? 'grid-cols-2'}
  `}>
    {children}
  </div>
);
