// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { GameSidebar, type SidebarMoves } from './game-sidebar';
import type { Ctx } from '../types';
import { makeCtx } from '../ctx-factory';

beforeAll(() => {
  const { unmount } = renderSidebar();
  unmount();
});


const defaultMoves: SidebarMoves = {
  switchMode: vi.fn(),
  startGame: vi.fn(),
  setPlayerNames: vi.fn(),
  setDifficulty: vi.fn(),
  resetGameState: vi.fn(),
  undo: vi.fn(),
  canUndo: false
};

const renderSidebar = (ctxOverrides: Partial<Ctx> = {}) => {
  const ctx = makeCtx({ currentPlayer: 0, ...ctxOverrides });
  return render(
    <MemoryRouter>
      <GameSidebar
        stepDescription=""
        ctx={ctx}
        playerNames={[]}
        moves={defaultMoves}
        variants={[{ botStrategy: () => {}, originalIndex: 0, disabled: false }]}
        selectedVariantIndex={0}
      />
    </MemoryRouter>
  );
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
