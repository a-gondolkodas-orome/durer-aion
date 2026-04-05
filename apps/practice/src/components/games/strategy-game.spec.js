import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { strategyGameFactory } from './strategy-game';

const MinimalBoardClient = ({ board, moves }) => (
  <button data-testid="move-btn" onClick={() => moves.mainMove(board)}>move</button>
);

const minimalConfig = (moves, endOfTurnMove) => ({
  rule: <></>,
  metadata: { name: 'Test' },
  BoardClient: MinimalBoardClient,
  generateStartBoard: () => ['initial'],
  moves,
  aiBotStrategy: () => {},
  getPlayerStepDescription: () => '',
  endOfTurnMove
});

const renderGame = (config) => {
  const Game = strategyGameFactory(config);
  return render(<MemoryRouter><Game /></MemoryRouter>);
};

describe('strategyGameFactory endOfTurnMove', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('calls endOfTurnMove after 750ms when a move returns autoEndOfTurn: true', () => {
    const autoMove = vi.fn((board) => ({ nextBoard: board }));
    const moves = {
      mainMove: (board, { events }) => { events.endTurn(); return { nextBoard: board, autoEndOfTurn: true }; },
      autoMove
    };

    const { getByTestId } = renderGame(minimalConfig(moves, 'autoMove'));
    fireEvent.click(getByTestId('move-btn'));

    expect(autoMove).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(750); });

    expect(autoMove).toHaveBeenCalledOnce();
  });

  it('does not call endOfTurnMove when a move does not return autoEndOfTurn', () => {
    const autoMove = vi.fn((board) => ({ nextBoard: board }));
    const moves = {
      mainMove: (board, { events }) => { events.endTurn(); return { nextBoard: board }; },
      autoMove
    };

    const { getByTestId } = renderGame(minimalConfig(moves, 'autoMove'));
    fireEvent.click(getByTestId('move-btn'));
    act(() => { vi.advanceTimersByTime(750); });

    expect(autoMove).not.toHaveBeenCalled();
  });
});
