// @vitest-environment jsdom
import { fireEvent, act } from '@testing-library/react';
import {
  makeConfig, ctxAwareConfig, renderGame, warmUpPlayerNameSetup,
  CtxAwareBoardClient, type Board
} from './spec-helpers';
import type { BoardClientProps, BotMove, Gameplay } from './types';

// Undo rewinds a whole turn, not a move: the snapshot is taken at the first
// move of a turn and cleared once the turn passes. Against the computer it also
// has to cancel a bot step that is already scheduled.

beforeAll(warmUpPlayerNameSetup);

describe('undo', () => {
  describe('vsHuman', () => {
    it('undo button is disabled before any move', () => {
      const { getByTestId } = renderGame(ctxAwareConfig());
      fireEvent.click(getByTestId('mode-vsHuman'));
      fireEvent.click(getByTestId('start-hh-game-0'));
      expect((getByTestId('undo-btn') as HTMLButtonElement).disabled).toBe(true);
    });

    it('undo button is enabled after a move', () => {
      const { getByTestId } = renderGame(ctxAwareConfig());
      fireEvent.click(getByTestId('mode-vsHuman'));
      fireEvent.click(getByTestId('start-hh-game-0'));
      fireEvent.click(getByTestId('move-btn'));
      expect((getByTestId('undo-btn') as HTMLButtonElement).disabled).toBe(false);
    });

    it('clicking undo restores the previous board and player', () => {
      const BoardWithDisplay = ({ board, ctx, moves }: BoardClientProps<Board>) => (
        <button
          data-testid="move-btn"
          disabled={!ctx.isClientMoveAllowed}
          onClick={() => moves.mainMove(board)}
        >{board.join(',')}</button>
      );
      const gameplay: Gameplay<Board> = {
        moves: {
          mainMove: {
            apply: (board: Board) => ({ nextBoard: [...board, 'moved'], isTurnEnd: true })
          }
        }
      };
      const { getByTestId } = renderGame(makeConfig({ BoardClient: BoardWithDisplay, gameplay }));
      fireEvent.click(getByTestId('mode-vsHuman'));
      fireEvent.click(getByTestId('start-hh-game-0'));
      expect(getByTestId('move-btn').textContent).toBe('initial'); // start board
      fireEvent.click(getByTestId('move-btn')); // player 0 moves → player 1's turn
      expect(getByTestId('move-btn').textContent).toBe('initial,moved'); // board advanced
      expect((getByTestId('move-btn') as HTMLButtonElement).disabled).toBe(false); // player 1 can move
      fireEvent.click(getByTestId('undo-btn')); // undo → back to player 0's turn
      expect(getByTestId('move-btn').textContent).toBe('initial'); // board restored
      expect((getByTestId('move-btn') as HTMLButtonElement).disabled).toBe(false); // player 0 can move
      expect((getByTestId('undo-btn') as HTMLButtonElement).disabled).toBe(true);  // snapshot cleared
    });

    it('clicking undo restores moveCount', () => {
      const BoardWithCount = ({ board, ctx, moves }: BoardClientProps<Board>) => (
        <button
          data-testid="move-btn"
          disabled={!ctx.isClientMoveAllowed}
          onClick={() => moves.mainMove(board)}
        >count:{ctx.moveCount}</button>
      );
      const { getByTestId } = renderGame(makeConfig({ BoardClient: BoardWithCount }));
      fireEvent.click(getByTestId('mode-vsHuman'));
      fireEvent.click(getByTestId('start-hh-game-0'));
      expect(getByTestId('move-btn').textContent).toBe('count:0');
      fireEvent.click(getByTestId('move-btn')); // moveCount → 1
      expect(getByTestId('move-btn').textContent).toBe('count:1');
      fireEvent.click(getByTestId('undo-btn')); // undo → moveCount back to 0
      expect(getByTestId('move-btn').textContent).toBe('count:0');
    });

    it('undo restores moveCount to the start of a multi-move turn', () => {
      // A turn with two moves before endTurn: undo must roll moveCount back by both.
      const gameplay: Gameplay<Board> = {
        moves: {
          mainMove: {
            apply: (board: Board) => ({ nextBoard: board, nextTurnState: 'step2' })
          },
          secondMove: {
            apply: (board: Board) => ({ nextBoard: board, isTurnEnd: true })
          }
        }
      };
      const BoardWithCount = ({ board, ctx, moves }: BoardClientProps<Board>) => (
        <>
          <button data-testid="move-btn" onClick={() => moves.mainMove(board)}>count:{ctx.moveCount}</button>
          <button data-testid="second-btn" onClick={() => moves.secondMove(board)}>second</button>
        </>
      );
      const { getByTestId } = renderGame(makeConfig({ BoardClient: BoardWithCount, gameplay }));
      fireEvent.click(getByTestId('mode-vsHuman'));
      fireEvent.click(getByTestId('start-hh-game-0'));
      fireEvent.click(getByTestId('move-btn')); // moveCount → 1, snapshot taken at 0
      fireEvent.click(getByTestId('second-btn')); // moveCount → 2, same turn
      expect(getByTestId('move-btn').textContent).toBe('count:2');
      fireEvent.click(getByTestId('undo-btn')); // undo whole turn → moveCount back to 0
      expect(getByTestId('move-btn').textContent).toBe('count:0');
    });

    it('undo is disabled after use (snapshot cleared)', () => {
      const { getByTestId } = renderGame(ctxAwareConfig());
      fireEvent.click(getByTestId('mode-vsHuman'));
      fireEvent.click(getByTestId('start-hh-game-0'));
      fireEvent.click(getByTestId('move-btn'));
      fireEvent.click(getByTestId('undo-btn'));
      expect((getByTestId('undo-btn') as HTMLButtonElement).disabled).toBe(true);
    });

    it('a new move after undo re-enables undo', () => {
      const { getByTestId } = renderGame(ctxAwareConfig());
      fireEvent.click(getByTestId('mode-vsHuman'));
      fireEvent.click(getByTestId('start-hh-game-0'));
      fireEvent.click(getByTestId('move-btn'));
      fireEvent.click(getByTestId('undo-btn'));
      fireEvent.click(getByTestId('move-btn')); // make a new move
      expect((getByTestId('undo-btn') as HTMLButtonElement).disabled).toBe(false);
    });

    it('resetGameState clears the undo snapshot', () => {
      const { getByTestId } = renderGame(ctxAwareConfig());
      fireEvent.click(getByTestId('mode-vsHuman'));
      fireEvent.click(getByTestId('start-hh-game-0'));
      fireEvent.click(getByTestId('move-btn')); // creates snapshot
      fireEvent.click(getByTestId('new-game-btn')); // reset
      fireEvent.click(getByTestId('start-hh-game-0'));
      expect((getByTestId('undo-btn') as HTMLButtonElement).disabled).toBe(true);
    });

    it('undo is enabled mid-turn (after first move but before endTurn)', () => {
      const gameplay: Gameplay<Board> = {
        moves: {
          mainMove: {
            apply: (board: Board) => ({ nextBoard: board, nextTurnState: 'step2' })
          }
        }
      };
      const { getByTestId } = renderGame(makeConfig({ BoardClient: CtxAwareBoardClient, gameplay }));
      fireEvent.click(getByTestId('mode-vsHuman'));
      fireEvent.click(getByTestId('start-hh-game-0'));
      fireEvent.click(getByTestId('move-btn')); // sets turnState = 'step2', no endTurn
      expect((getByTestId('undo-btn') as HTMLButtonElement).disabled).toBe(false);
    });
  });

  describe('vsComputer', () => {
    beforeAll(() => { vi.useFakeTimers(); });
    afterAll(() => { vi.useRealTimers(); });
    afterEach(() => { vi.clearAllTimers(); });

    it('undo enabled immediately after human move (before bot fires)', () => {
      const botStrategy = vi.fn((): BotMove[] => []);
      const { getByTestId } = renderGame(ctxAwareConfig(botStrategy));
      fireEvent.click(getByTestId('role-btn-0'));
      fireEvent.click(getByTestId('move-btn')); // human moves
      expect((getByTestId('undo-btn') as HTMLButtonElement).disabled).toBe(false);
    });

    it('clicking undo before bot fires cancels bot and restores human turn', () => {
      const botStrategy = vi.fn((): BotMove[] => []);
      const { getByTestId } = renderGame(ctxAwareConfig(botStrategy));
      fireEvent.click(getByTestId('role-btn-0'));
      fireEvent.click(getByTestId('move-btn')); // human moves → bot thinking
      fireEvent.click(getByTestId('undo-btn'));  // undo before bot fires
      act(() => { vi.advanceTimersByTime(1500); }); // bot timeout should be canceled
      expect(botStrategy).not.toHaveBeenCalled();
      expect((getByTestId('move-btn') as HTMLButtonElement).disabled).toBe(false); // human's turn
    });

    it('undo disabled after bot completes its move', () => {
      const botStrategy = vi.fn(() => ({ move: 'mainMove' }));
      const { getByTestId } = renderGame(ctxAwareConfig(botStrategy));
      fireEvent.click(getByTestId('role-btn-0'));
      fireEvent.click(getByTestId('move-btn')); // human moves
      act(() => { vi.advanceTimersByTime(1500); }); // bot fires and calls mainMove
      expect((getByTestId('undo-btn') as HTMLButtonElement).disabled).toBe(true);
    });

    it('undo does not re-trigger bot after restoring human turn', () => {
      const botStrategy = vi.fn((): BotMove[] => []);
      const { getByTestId } = renderGame(ctxAwareConfig(botStrategy));
      fireEvent.click(getByTestId('role-btn-0'));
      fireEvent.click(getByTestId('move-btn')); // human moves → bot thinking
      fireEvent.click(getByTestId('undo-btn'));  // undo
      act(() => { vi.advanceTimersByTime(1500); }); // advance timers
      expect(botStrategy).not.toHaveBeenCalled(); // bot never fired
    });
  });
});
