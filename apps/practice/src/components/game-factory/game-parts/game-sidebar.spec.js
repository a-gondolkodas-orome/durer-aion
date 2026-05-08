import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { GameSidebar } from './game-sidebar';

const defaultVariants = [{ botStrategy: () => {}, generateStartBoard: () => {}, originalIndex: 0, disabled: false }];

const renderSidebar = (ctxOverrides = {}, movesOverrides = {}, variants = defaultVariants) => {
  const ctx = {
    isHumanVsHumanGame: false,
    phase: 'roleSelection',
    isClientMoveAllowed: false,
    isRoleSelectorWinner: false,
    playerNames: ['Player 1', 'Player 2'],
    currentPlayerName: 'Player 1',
    winnerName: null,
    ...ctxOverrides
  };
  const moves = {
    switchMode: vi.fn(),
    startGame: vi.fn(),
    startNewGame: vi.fn(),
    setPlayerNames: vi.fn(),
    setDifficulty: vi.fn(),
    ...movesOverrides
  };
  const { container } = render(
    <MemoryRouter>
      <GameSidebar
        roleLabels={undefined}
        stepDescription=""
        ctx={ctx}
        moves={moves}
        variants={variants}
        selectedVariantIndex={0}
      />
    </MemoryRouter>
  );
  return { container, moves };
};

describe('GameSidebar', () => {
  it('shows name inputs in vsHuman roleSelection', () => {
    renderSidebar({ isHumanVsHumanGame: true, phase: 'roleSelection' });
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
  });

  it('does not show name inputs in vsComputer roleSelection', () => {
    renderSidebar({ isHumanVsHumanGame: false, phase: 'roleSelection' });
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  });

  it('shows spinner in vsComputer play when it is the computer turn', () => {
    const { container } = renderSidebar({
      isHumanVsHumanGame: false,
      phase: 'play',
      isClientMoveAllowed: false
    });
    expect(container.querySelector('.animate-spin')).not.toBeNull();
  });

  it('does not show spinner in vsHuman play', () => {
    const { container } = renderSidebar({
      isHumanVsHumanGame: true,
      phase: 'play',
      isClientMoveAllowed: true
    });
    expect(container.querySelector('.animate-spin')).toBeNull();
  });
});
