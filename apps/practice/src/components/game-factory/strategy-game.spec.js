import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { strategyGameFactory, resolveVariants } from './strategy-game';

const makeVariant = (overrides = {}) => ({
  generateStartBoard: () => [],
  botStrategy: () => {},
  ...overrides
});

describe('resolveVariants', () => {
  it('throws when variants is empty', () => {
    expect(() => resolveVariants([])).toThrow('variants must be a non-empty array');
  });

  it('throws when variants is missing', () => {
    expect(() => resolveVariants(undefined)).toThrow('variants must be a non-empty array');
  });

  it('throws when multiple variants have no isDefault', () => {
    expect(() => resolveVariants([makeVariant(), makeVariant()]))
      .toThrow('exactly one variant must have isDefault: true');
  });

  it('throws when multiple variants have more than one isDefault', () => {
    expect(() => resolveVariants([makeVariant({ isDefault: true }), makeVariant({ isDefault: true })]))
      .toThrow('exactly one variant must have isDefault: true');
  });

  it('throws when the default variant has no generateStartBoard', () => {
    expect(() => resolveVariants([{ botStrategy: () => {} }]))
      .toThrow('the default variant must define generateStartBoard');
  });

  it('uses the single variant as default without requiring isDefault', () => {
    const generateStartBoard = () => [];
    const { defaultVariantIndex } = resolveVariants([makeVariant({ generateStartBoard })]);
    expect(defaultVariantIndex).toBe(0);
  });

  it('picks the variant marked isDefault as the default', () => {
    const generateStartBoard = () => [];
    const variants = [makeVariant(), makeVariant({ isDefault: true, generateStartBoard })];
    const { defaultVariantIndex, defaultVariant } = resolveVariants(variants);
    expect(defaultVariantIndex).toBe(1);
    expect(defaultVariant.generateStartBoard).toBe(generateStartBoard);
  });

  it('fills missing botStrategy from the default variant', () => {
    const defaultBot = () => {};
    const variants = [
      makeVariant({ isDefault: true, botStrategy: defaultBot }),
      makeVariant({ botStrategy: undefined })
    ];
    const { resolvedVariants } = resolveVariants(variants);
    expect(resolvedVariants[1].botStrategy).toBe(defaultBot);
  });

  it('falls back to first available botStrategy when default has none', () => {
    const otherBot = () => {};
    const variants = [
      makeVariant({ isDefault: true, botStrategy: undefined }),
      makeVariant({ botStrategy: otherBot })
    ];
    const { resolvedVariants } = resolveVariants(variants);
    expect(resolvedVariants[0].botStrategy).toBe(otherBot);
    expect(resolvedVariants[1].botStrategy).toBe(otherBot);
  });

  it('keeps own botStrategy when defined', () => {
    const ownBot = () => {};
    const defaultBot = () => {};
    const variants = [
      makeVariant({ isDefault: true, botStrategy: defaultBot }),
      makeVariant({ botStrategy: ownBot })
    ];
    const { resolvedVariants } = resolveVariants(variants);
    expect(resolvedVariants[1].botStrategy).toBe(ownBot);
  });

  it('leaves botStrategy undefined when no variant has one', () => {
    const variants = [makeVariant({ botStrategy: undefined })];
    const { resolvedVariants } = resolveVariants(variants);
    expect(resolvedVariants[0].botStrategy).toBeUndefined();
  });
});

const MinimalBoardClient = ({ board, moves }) => (
  <button data-testid="move-btn" onClick={() => moves.mainMove(board)}>move</button>
);

const minimalConfig = (moves, endOfTurnMove) => ({
  presentation: {
    rule: <></>,
    title: 'Test',
    getPlayerStepDescription: () => ''
  },
  BoardClient: MinimalBoardClient,
  gameplay: { moves, endOfTurnMove },
  variants: [{ botStrategy: () => {}, generateStartBoard: () => ['initial'] }]
});

const renderGame = (config) => {
  const Game = strategyGameFactory(config);
  return render(<MemoryRouter><Game /></MemoryRouter>);
};

const CtxAwareBoardClient = ({ board, ctx, moves }) => (
  <button
    data-testid="move-btn"
    disabled={!ctx.isClientMoveAllowed}
    onClick={() => moves.mainMove(board)}
  >move</button>
);

const ctxAwareConfig = (overrides = {}) => {
  const { botStrategy, endOfTurnMove, ...rest } = overrides;
  return {
    presentation: {
      rule: <></>,
      title: 'Test',
      getPlayerStepDescription: () => ''
    },
    BoardClient: CtxAwareBoardClient,
    gameplay: {
      moves: {
        mainMove: (board, { events }) => { events.endTurn(); return { nextBoard: board }; }
      },
      endOfTurnMove
    },
    variants: [{ botStrategy: botStrategy ?? (() => {}), generateStartBoard: () => ['initial'] }],
    ...rest
  };
};

describe('isClientMoveAllowed', () => {
  it('allows both players to move in vsHuman mode', () => {
    const { getByTestId } = renderGame(ctxAwareConfig());
    fireEvent.click(getByTestId('mode-vsHuman'));
    expect(getByTestId('move-btn').disabled).toBe(true);
    fireEvent.click(getByTestId('start-hh-game'));
    expect(getByTestId('move-btn').disabled).toBe(false);
    fireEvent.click(getByTestId('move-btn')); // endTurn → currentPlayer 1
    expect(getByTestId('move-btn').disabled).toBe(false);
  });

  it('disables moves during the computer turn in vsComputer mode', () => {
    const { getByTestId } = renderGame(ctxAwareConfig());
    fireEvent.click(getByTestId('role-btn-0'));
    expect(getByTestId('move-btn').disabled).toBe(false);
    fireEvent.click(getByTestId('move-btn')); // endTurn → bot's turn
    expect(getByTestId('move-btn').disabled).toBe(true);
  });
});

describe('Bot behavior by mode', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('does not call botStrategy in vsHuman mode', () => {
    const botStrategy = vi.fn();
    const { getByTestId } = renderGame(ctxAwareConfig({ botStrategy }));
    fireEvent.click(getByTestId('mode-vsHuman'));
    fireEvent.click(getByTestId('start-hh-game'));
    fireEvent.click(getByTestId('move-btn')); // endTurn → currentPlayer 1
    act(() => { vi.advanceTimersByTime(1500); });
    expect(botStrategy).not.toHaveBeenCalled();
  });

  it('calls botStrategy when it becomes the computer turn', () => {
    const botStrategy = vi.fn();
    const { getByTestId } = renderGame(ctxAwareConfig({ botStrategy }));
    fireEvent.click(getByTestId('role-btn-0'));
    fireEvent.click(getByTestId('move-btn')); // endTurn → bot's turn
    act(() => { vi.advanceTimersByTime(1500); });
    expect(botStrategy).toHaveBeenCalledOnce();
  });
});

describe('switchMode', () => {
  it('resets to roleSelection when switching mode during play', () => {
    const { getByTestId } = renderGame(ctxAwareConfig());
    fireEvent.click(getByTestId('role-btn-0'));
    expect(getByTestId('move-btn').disabled).toBe(false);
    fireEvent.click(getByTestId('mode-vsHuman'));
    expect(getByTestId('start-hh-game')).toBeTruthy();
  });

  it('resets to roleSelection when switching back to vsComputer', () => {
    const { getByTestId } = renderGame(ctxAwareConfig());
    fireEvent.click(getByTestId('mode-vsHuman'));
    fireEvent.click(getByTestId('start-hh-game'));
    fireEvent.click(getByTestId('move-btn'));
    fireEvent.click(getByTestId('mode-vsComputer'));
    expect(getByTestId('role-btn-0')).toBeTruthy();
  });
});

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
