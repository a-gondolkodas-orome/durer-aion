// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { GameSidebar, type SidebarMoves } from './game-sidebar';
import type { Ctx } from '../../types';
import { makeCtx } from 'test-utils';

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

const renderSidebar = (ctxOverrides: Partial<Ctx> = {}, playerNames: string[] = ['', '']) => {
  const ctx = makeCtx({ currentPlayer: 0, ...ctxOverrides });
  return render(
    <MemoryRouter>
      <GameSidebar
        stepDescription=""
        ctx={ctx}
        playerNames={playerNames}
        moves={defaultMoves}
        variants={[{ hasBotStrategy: true, originalIndex: 0, disabled: false }]}
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

  describe('colliding player names', () => {
    const nameSetup = (playerNames: string[]) =>
      renderSidebar({ isHumanVsHumanGame: true, phase: 'roleSelection' }, playerNames);
    const startButtons = () => [0, 1].map(i => screen.getByTestId(`start-hh-game-${i}`));

    it('lets the game start with two different names', () => {
      nameSetup(['Alice', 'Bob']);
      expect(startButtons().every(button => (button as HTMLButtonElement).disabled)).toBe(false);
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('blocks both starts when the same name is typed twice', () => {
      nameSetup(['Alice', 'Alice']);
      expect(startButtons().every(button => (button as HTMLButtonElement).disabled)).toBe(true);
      expect(screen.getByRole('alert').textContent).toContain('nem lehet azonos');
    });

    it('blocks the start when a name matches the default of the empty field', () => {
      nameSetup(['', '1. játékos']);
      expect(startButtons().every(button => (button as HTMLButtonElement).disabled)).toBe(true);
      // the empty field is the confusing part, so the message spells out what fills it in
      expect(screen.getByRole('alert').textContent).toContain('Az üresen hagyott mező');
    });
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

  it('does not show spinner in vsHuman play even when client move is not allowed', () => {
    // the spinner must never appear in vsHuman mode, regardless of isClientMoveAllowed;
    // only the !isHumanVsHumanGame guard prevents it here
    const { container } = renderSidebar({
      isHumanVsHumanGame: true,
      phase: 'play',
      isClientMoveAllowed: false
    });
    expect(container.querySelector('.animate-spin')).toBeNull();
  });
});
